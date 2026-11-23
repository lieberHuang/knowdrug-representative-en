const assert=require('node:assert/strict');

(async()=>{
 const {monitorCertificate}=await import('../server/cert-monitor.mjs');
 const now=Date.now(),calls=[];
 const run=(file,args)=>calls.push([file,args]);
 const health=async()=>calls.push(['health']);
 const healthy=await monitorCertificate({now,readExpiry:()=>now+5*86400000,run,health});
 assert.equal(healthy.renewed,false);
 assert.deepEqual(calls.map(([file])=>file),['/usr/sbin/nginx','/usr/bin/systemctl','health']);

 calls.length=0;let renewed=false;
 const expiring=await monitorCertificate({now,readExpiry:()=>now+(renewed?6:1)*86400000,run:(file,args)=>{calls.push([file,args]);if(file.includes('certbot'))renewed=true;},health});
 assert.equal(expiring.renewed,true);
 assert.deepEqual(calls.map(([file])=>file),['/opt/knowdrug-certbot/bin/certbot','/usr/sbin/nginx','/usr/bin/systemctl','health']);
 assert(calls[0][1].includes('--force-renewal'));

 await assert.rejects(monitorCertificate({now,readExpiry:()=>now+86400000,run:()=>{},health}),/did not extend validity/);
 await assert.rejects(monitorCertificate({now,readExpiry:()=>now+5*86400000,run:()=>{},health:async()=>{throw new Error('health failed');}}),/health failed/);
 console.log('PASS: certificate monitor checks validity, renews near expiry, reloads Nginx and verifies HTTPS');
})().catch(error=>{console.error(error);process.exitCode=1;});
