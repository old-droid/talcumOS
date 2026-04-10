// talcumOS Terminal Module - Dynamic Commands with Talcum API
const TerminalCommands={
    help:()=>'Available: help, clear, date, whoami, ls, pwd, echo, mkdir, touch, rm, cat, save, load, uptime, fortune',
    clear:()=>null,
    date:()=>new Date().toString(),
    whoami:()=>'mobile',
    pwd:()=>'/home/mobile',
    uptime:()=>'up 12:34, 1 user, load average: 0.08, 0.05, 0.01',
    fortune:()=>'Optimization is the root of all performance.',
    ls:(args)=>{
        const files=window.talcum.list();
        return files.length>0?files.join('  '):'No files';
    },
    echo:(args)=>args.slice(1).join(' ')||'',
    mkdir:(args)=>{
        if(!args[1])return 'Usage: mkdir <name>';
        const dir={type:'dir',name:args[1],created:new Date().toISOString()};
        window.talcum.store('dir_'+args[1],JSON.stringify(dir));
        return 'Directory created: '+args[1];
    },
    touch:(args)=>{
        if(!args[1])return 'Usage: touch <filename>';
        window.talcum.store(args[1],'');
        return 'File created: '+args[1];
    },
    rm:(args)=>{
        if(!args[1])return 'Usage: rm <name>';
        window.talcum.remove(args[1]);
        return 'Removed: '+args[1];
    },
    cat:(args)=>{
        if(!args[1])return 'Usage: cat <filename>';
        const content=window.talcum.pull(args[1]);
        return content||'File not found';
    },
    save:(args)=>{
        if(!args[1]||!args[2])return 'Usage: save <name> <content>';
        const name=args[1];
        const content=args.slice(2).join(' ');
        window.talcum.store(name,content);
        return 'Saved: '+name+' ('+content.length+' bytes)';
    },
    load:(args)=>{
        if(!args[1])return 'Usage: load <name>';
        const data=window.talcum.pull(args[1]);
        return data?data:'Not found';
    }
};

function execTerminalCommand(cmd){
    const parts=cmd.trim().split(' ');
    const command=parts[0].toLowerCase();
    
    if(command==='clear')return {clear:true};
    if(!TerminalCommands[command])return 'bash: command not found: '+command;
    
    try{
        const result=TerminalCommands[command](parts);
        return result||'';
    }catch(e){
        return 'Error: '+e.message;
    }
}
