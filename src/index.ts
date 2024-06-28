import WebSocket from 'ws';

const config = {
  wsUrl: process.env.WS_URL || 'ws://localhost:15002',
  groupIds: (process.env.GROUP_NUMBER || '').split(',').map(entry => parseInt(entry)),
}

const ws = new WebSocket(config.wsUrl);

const privileged = new Map<number, number[]>();

const helpText: string = `Commands:

\`/help\`: View the usage of this bot.

\`/grant [QQ Number] [Title]\`: Grants a given user the specified title. The title should be no longer than 18 bytes. One Chinese character in UTF-8 occupies 3 bytes, so a title in Chinese should be no longer than 6 Chinese characters. 

> Do not attempt to use ASCII characters and Unicode characters together in a title longer than 18 bytes, because it will be cut off after its 18th byte, and if the 18th byte is within a Unicode character, this will cause unexpected outcome.

\`/refresh-privileged-list\`: Although this application actively listens to the changes of group admins, there are some chance that the bot does not receive the notice. So if the group admin list changes and some of the admins cannot execute commands, those who have the privilege should manually execute this.`

function sendGroupMessage(groupId: number, text: string) {
  ws.send(JSON.stringify({
    action: 'send_group_msg',
    params: {
      group_id: groupId,
      message: [
        {
          type: 'text',
          data: { text }
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
      no_cache: true,
    },
    echo: 'RefreshPrivilegedList',
  }));
}

ws.on('open', () => {
  config.groupIds.forEach(refreshPrivilegedList);
});

ws.on("message", (data) => {
  const body = JSON.parse(data.toString());
  //console.log(body);
  if (
    body.post_type === 'message' &&
    body.message_type === 'group' &&
    body.sub_type === 'normal' &&
    config.groupIds.indexOf(body.group_id) !== -1 && // quiz: why use == instead of === ?
    privileged.get(body.group_id)?.indexOf(body.user_id) !== -1
  ) {
    let params = []
    if (body.message.length === 1 && body.message[0].type === 'text'){
      const text = body.message[0].data.text as string;
      params = text.split(' ');
    }
    else{
      for (let i in body.message){
        if (body.message[i].type === 'text') {
          params.push(body.message[i].data.text);
        }
        else if (body.message[i].type === 'at') {
          params.push(body.message[i].data.qq)
        }
        if (params[0] === '/grant'){
          if (params.length !== 3) { return; }
        }
      }
    }
    console.log(params);
    if (params[0].startsWith('/grant')){
      console.log(`Command called: ${params[0]} [group=${body.group_id},caller=${body.user_id}]`);
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
    if (params[0].startsWith('/refresh-privileged-list')  && params.length === 1) {
      refreshPrivilegedList(body.group_id);
    }

    if (params[0].startsWith('/help') && params.length === 1) {
      sendGroupMessage(body.group_id, helpText)
    }
    
    /*
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

      if (text === '/help') {
        sendGroupMessage(body.group_id, helpText)
      }
    }
    */
  }

  if (
    body.post_type === 'notice' &&
    body.notice_type === 'group_admin' &&
    config.groupIds.indexOf(body.group_id) !== -1
  ) {
    refreshPrivilegedList(body.group_id);
  }

  if (body.status === 'ok' && body.echo === ('RefreshPrivilegedList')) {
    const memberList = body.data as any[];
    const groupId = memberList[0].group_id as number;
    const privilegedList = memberList
    .filter(entry => entry.role === 'admin')
    .map(entry => entry.user_id);
    privileged.set(groupId, privilegedList);

    const logMessage = `Privileged list of ${groupId} updated: ${privilegedList.join(',')}`;

    console.log(logMessage);
    if (process.env.DEBUG_MODE) {
      sendGroupMessage(groupId, logMessage);
    }
  }
});
ws.on('close', () => {
  console.log('Instance closed.');
})