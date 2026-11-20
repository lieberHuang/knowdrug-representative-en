const assert=require('node:assert/strict');
const encode=new TextEncoder();
const json=value=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(value)}}]}),{headers:{'Content-Type':'application/json'}});
const stream=text=>new Response(new ReadableStream({start(controller){controller.enqueue(encode.encode('data: '+JSON.stringify({choices:[{delta:{content:text}}]})+'\n\ndata: [DONE]\n\n'));controller.close();}}),{headers:{'Content-Type':'text/event-stream'}});
const frames=text=>text.split('\n\n').filter(Boolean).map(frame=>({type:frame.match(/event: (.*)/)?.[1],data:JSON.parse(frame.match(/data: (.*)/)?.[1]||'null')}));
(async()=>{
 const {handleKnowledgeStream}=await import('../server/worker.mjs');
 const prompts=[];let i=0;
 const model=async(_,options)=>{const body=JSON.parse(options.body);prompts.push(body.messages[0].content);i++;if(i===1)return json({inScope:true});if(body.stream)return stream('Please check the approved Zadaxin prescribing information.');return json({title:'Zadaxin prescribing information',followUps:['What are the Zadaxin indications?','What Zadaxin safety information should I check?','Where can I verify Zadaxin evidence?']});};
 const request=new Request('https://api.example/api/knowledge/stream',{method:'POST',headers:{Origin:'https://lieberhuang.github.io','Content-Type':'application/json','CF-Connecting-IP':'english-stream-test'},body:JSON.stringify({locale:'en',audience:'doctor',expert:'drug',question:'日达仙说明书应重点核对哪些项目？'})});
 const result=frames(await(await handleKnowledgeStream(request,{DEEPSEEK_API_KEY:'test'},model)).text());
 assert.equal(result.at(-1).type,'done');assert.equal(result.at(-1).data.answer.title,'Zadaxin prescribing information');assert.equal(result.at(-1).data.followUps.length,3);assert(!/[\u3400-\u9fff]/.test(JSON.stringify(result)));assert.match(prompts[1],/English only/);assert.match(prompts[2],/English/);
 console.log('PASS: English stream and follow-ups with Chinese source question');
})().catch(e=>{console.error(e);process.exitCode=1});
