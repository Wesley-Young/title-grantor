import WebSocket from 'ws';
import {randomUUID} from "node:crypto";
import {log} from "node:util";

const config = {
  wsUrl: process.env.WS_URL || 'ws://localhost:15002',
  groupIds: (process.env.GROUP_NUMBER || '').split(',').map(entry => parseInt(entry)),
}

const ws = new WebSocket(config.wsUrl);

const privileged = new Map<number, number[]>();

function sendGroupMessage(groupId: number, text: string) {
  ws.send(JSON.stringify({
    action: 'send_group_msg',
    params: {
      group_id: groupId,
      message: [
        {
          type: 'text',
          data: {
            text
          }
        }
      ]
    }
  }));
}

function refreshPrivilegedList(groupId: number) {
  ws.send(JSON.stringify({
    action: 'get_group_member_list',
    params: {
      group_id: groupId,
    },
    echo: 'RefreshPrivilegedList',
  }));
}

ws.on('message', (data) => {
  const body = JSON.parse(data.toString());

  if (body.status === 'ok' && body.echo === ('RefreshPrivilegedList')) {
    const memberList = body.data as any[];
    const groupId = memberList[0].group_id as number;
    const privilegedList = memberList
      .filter(entry => entry.role === 'owner' || entry.role === 'admin')
      .map(entry => entry.user_id);
    privileged.set(groupId, privilegedList);

    const logMessage = `Privileged list of ${groupId} updated: ${privilegedList.join(',')}`;

    console.log(logMessage);
    if (process.env.DEBUG_MODE) {
      sendGroupMessage(groupId, logMessage);
    }
  }
});

ws.on('open', () => {
  config.groupIds.forEach(refreshPrivilegedList);
});


ws.on("message", (data) => {
  const body = JSON.parse(data.toString());
  // console.log(body);
  if (
    body.post_type === 'message' &&
    body.message_type === 'group' &&
    body.sub_type === 'normal' &&
    body.group_id == config.groupIds && // quiz: why use == instead of === ?
    privileged.get(body.group_id)?.indexOf(body.user_id) !== -1
  ) {
    const segment = (body.message as any[])[0];
    if (segment.type === 'text') {
      const text = segment.data.text as string;

      if (text.startsWith('/grant')) {
        const params = text.split(' ');
        if (params.length !== 3) { return; }
        console.log(`Command called: ${text} [group=${body.group_id},caller=${body.user_id}]`);
        try {
          const grantedId = parseInt(params[1]);
          const title = params[2];

          if (process.env.DEBUG_MODE) {
            sendGroupMessage(body.group_id, `Trying to grant ${grantedId} a title ${title} `)
          }

          ws.send(JSON.stringify({
            action: 'set_group_special_title',
            params: {
              group_id: body.group_id,
              user_id: grantedId,
              special_title: title
            }
          }));
        } catch (e) {
          console.error(e);
        }
      }

      if (text === '/refresh-privileged-list') {
        refreshPrivilegedList(body.group_id);
      }
    }
  }
});

ws.on('close', () => {
  console.log('Instance closed.');
})