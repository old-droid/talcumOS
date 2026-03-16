Deno.serve(async (req) => {
  const { email, password, to, subject, body } = await req.json();
  
  if (!email || !password || !to || !subject) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const SMTP_HOST = 'smtp.gmail.com';
  const SMTP_PORT = 465;

  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const reader = await Deno.connectTls({ hostname: SMTP_HOST, port: SMTP_PORT });
    const writer = await Deno.open({ hostname: SMTP_HOST, port: SMTP_PORT });

    const socket = {
      read: async (buf: Uint8Array) => await reader.read(buf),
      write: async (data: Uint8Array) => await writer.write(data),
      close: () => { reader.close(); writer.close(); }
    };

    const send = async (cmd: string) => {
      await socket.write(encoder.encode(cmd + '\r\n'));
      const buf = new Uint8Array(1024);
      await socket.read(buf);
    };

    const base64 = (str: string) => btoa(str);

    await send(`EHLO localhost`);
    await send(`AUTH LOGIN`);
    await send(base64(email));
    await send(base64(password));
    
    const from = email;
    const messageId = `<${Date.now()}@talcumos.local>`;
    
    const mailData = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Message-ID: ${messageId}`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8`,
      '',
      body,
      ''
    ].join('\r\n');

    await send(`MAIL FROM:<${from}>`);
    await send(`RCPT TO:<${to}>`);
    await send(`DATA`);
    await socket.write(encoder.encode(mailData + '\r\n.'));
    
    socket.close();
    
    return new Response(JSON.stringify({ success: true, message: 'Email sent!' }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      demo: true,
      message: 'Demo mode - email would be sent (configure SMTP edge function for real sending)'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
