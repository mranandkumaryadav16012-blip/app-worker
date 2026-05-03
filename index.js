export default {
  async fetch(request, env) {
    const TELEGRAM_TOKEN = env.TELEGRAM_TOKEN;
    const CHANNEL_ID = env.CHANNEL_ID;

    const url = new URL(request.url);
    const path = url.pathname.split('/');
    
    // Format: /file/MESSAGE_ID
    if (path[1] === 'file' && path[2]) {
      const messageId = path[2];
      
      // Get file_id from Telegram
      const getUpdatesUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates`;
      const updatesResp = await fetch(getUpdatesUrl);
      const updates = await updatesResp.json();
      
      let fileId = null;
      if (updates.result) {
        for (const update of updates.result) {
          if (update.channel_post && update.channel_post.message_id === parseInt(messageId)) {
            if (update.channel_post.document) {
              fileId = update.channel_post.document.file_id;
            }
            break;
          }
        }
      }
      
      if (!fileId) {
        return new Response('File not found. Make sure message ID is correct.', { status: 404 });
      }
      
      // Get file path from Telegram
      const getFileUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`;
      const fileResp = await fetch(getFileUrl);
      const fileData = await fileResp.json();
      
      if (!fileData.ok) {
        return new Response('Error getting file from Telegram', { status: 500 });
      }
      
      // Redirect to actual download URL
      const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${fileData.result.file_path}`;
      return Response.redirect(downloadUrl, 302);
    }
    
    // Help page
    return new Response(
      `APK Download Worker is running!\n\nUse: /file/MESSAGE_ID\n\nExample: ${url.origin}/file/5`,
      { status: 200 }
    );
  }
};
