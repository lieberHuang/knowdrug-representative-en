import {readFileSync} from 'node:fs';
import {X509Certificate} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const certificatePath='/etc/letsencrypt/live/101.132.38.176/fullchain.pem';
const certbotPath='/opt/knowdrug-certbot/bin/certbot';
const healthURL='https://101.132.38.176/api/health';
const renewalWindowMs=72*60*60*1000;

function certificateExpiry(){
 const certificate=new X509Certificate(readFileSync(certificatePath));
 const expiry=Date.parse(certificate.validTo);
 if(!Number.isFinite(expiry))throw new Error('Cannot read certificate expiry');
 return expiry;
}

function command(file,args){execFileSync(file,args,{stdio:'inherit',timeout:120000});}

async function checkHealth(){
 const response=await fetch(healthURL,{signal:AbortSignal.timeout(15000)});
 if(!response.ok||(await response.json()).ok!==true)throw new Error('HTTPS API health check failed');
}

export async function monitorCertificate({now=Date.now(),readExpiry=certificateExpiry,run=command,health=checkHealth}={}){
 const originalExpiry=readExpiry();
 let renewed=false;
 if(originalExpiry-now<=renewalWindowMs){
  run(certbotPath,['renew','--cert-name','101.132.38.176','--force-renewal','--no-random-sleep-on-renew','--quiet']);
  if(readExpiry()-Date.now()<=renewalWindowMs)throw new Error('Certificate renewal did not extend validity');
  renewed=true;
 }
 run('/usr/sbin/nginx',['-t']);
 run('/usr/bin/systemctl',['reload','nginx']);
 await health();
 const expiry=readExpiry();
 console.log(`${renewed?'Renewed':'Checked'} HTTPS certificate; valid until ${new Date(expiry).toISOString()}`);
 return {renewed,expiry};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 monitorCertificate().catch(error=>{console.error(`Certificate monitor failed: ${error.message}`);process.exitCode=1;});
}
