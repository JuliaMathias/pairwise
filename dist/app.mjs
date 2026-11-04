/** Owns the ephemeral file queue and generated Blob URLs; all pixels stay local. */
import {sortedGroups,layout,makeZip,outputFilename,safePrefix,validOffset} from './core.mjs';
const $=id=>document.getElementById(id);
let images=[], outputs=[], direction='vertical', busy=false, nextId=0;
const message=(text,error=false)=>{$('status').textContent=text;$('status').classList.toggle('error',error);};
const element=(tag,className,text)=>{const node=document.createElement(tag);node.className=className;if(text!==undefined)node.textContent=text;return node;};
/** Blank offset means the default zero; invalid values disable generation. */
function numberingOffset() {
  const field = $('number-offset');
  return field.validity.badInput ? NaN : Number(field.value);
}

/** Preview the exact sanitized filename before doing pixel work. */
function updateNamePreview() {
  $('filename-preview').textContent = validOffset(numberingOffset())
    ? `First image: ${outputFilename($('output-name').value, 0, numberingOffset(), direction)}`
    : 'Enter a whole-number offset from 0 to 999999999.';
}

function groupSize(){return Number($('group-size').value);}
function clearOutputs(){for(const output of outputs)URL.revokeObjectURL(output.url);outputs=[];$('result-grid').replaceChildren();$('results').hidden=true;}
function setBusy(value){busy=value;for(const id of ['browse','add','clear','vertical','horizontal','group-size','output-name','number-offset','files','bundle'])$(id).disabled=value;document.querySelectorAll('.remove').forEach(button=>button.disabled=value);updateControls();}
function updateControls(){const count=groupSize(),valid=Number.isInteger(count)&&count>=2,offsetValid=validOffset(numberingOffset());updateNamePreview();$('generate').disabled=busy||images.length<2||!valid||!offsetValid;$('ready-note').textContent=busy?'Joining images…':!valid?'Enter a whole number of at least 2':!offsetValid?'Enter a valid numbering offset':images.length<2?'Choose at least 2 images to get started':`${Math.ceil(images.length/count)} output image${Math.ceil(images.length/count)===1?'':'s'} · ${count} per group`;$('queue').hidden=images.length===0;$('count').textContent=images.length;}
function renderQueue(){const list=$('pair-list');list.replaceChildren();updateControls();if(!Number.isInteger(groupSize())||groupSize()<2)return;sortedGroups(images,groupSize()).forEach((group,index)=>{const row=element('div','pair-row');row.style.flexWrap='wrap';row.append(element('span','pair-number',String(index+1).padStart(2,'0')));group.forEach(image=>{const item=element('div','file-item');item.style.flexBasis='40%';const thumbnail=element('img','');thumbnail.src=image.url;thumbnail.alt='';const name=element('span','file-name',image.name);name.title=image.name;const remove=element('button','remove','×');remove.setAttribute('aria-label',`Remove ${image.name}`);remove.onclick=()=>{URL.revokeObjectURL(image.url);images=images.filter(i=>i.id!==image.id);clearOutputs();renderQueue();message('');};item.append(thumbnail,name,remove);row.append(item);});if(group.length<groupSize())row.append(element('span','unpaired',`${group.length} in final group`));list.append(row);});}
/** Decode before accepting a file so corrupt or unsupported files cannot affect pairing. */
async function addFiles(files){if(busy)return;setBusy(true);clearOutputs();message('Reading images…');const errors=[];for(const file of files){if(!/^image\/(png|jpeg|webp|gif|avif|bmp)$/.test(file.type)){errors.push(`${file.name}: unsupported type`);continue;}if(file.size>100*1024*1024){errors.push(`${file.name}: larger than 100 MB`);continue;}let url=URL.createObjectURL(file);try{const image=new Image();image.src=url;await image.decode();if(image.naturalWidth*image.naturalHeight>40000000)throw new Error('over 40 megapixels');images.push({id:nextId++,name:file.name,file,url,width:image.naturalWidth,height:image.naturalHeight});}catch{URL.revokeObjectURL(url);errors.push(`${file.name}: cannot read image or exceeds 40 megapixels`);}}renderQueue();setBusy(false);message(errors.length?`Skipped ${errors.length} file(s):\n${errors.join('\n')}`:`${images.length} images ready.`,!!errors.length);$('files').value='';}
$('browse').onclick=$('add').onclick=()=>$('files').click();$('files').onchange=event=>addFiles(event.target.files);
for(const type of ['dragenter','dragover'])$('dropzone').addEventListener(type,event=>{event.preventDefault();if(!busy)$('dropzone').classList.add('drag');});
for(const type of ['dragleave','drop'])$('dropzone').addEventListener(type,event=>{event.preventDefault();$('dropzone').classList.remove('drag');});
$('dropzone').addEventListener('drop',event=>addFiles(event.dataTransfer.files));
window.addEventListener('dragover',event=>event.preventDefault());window.addEventListener('drop',event=>event.preventDefault());
$('clear').onclick=()=>{images.forEach(i=>URL.revokeObjectURL(i.url));images=[];clearOutputs();renderQueue();message('');};
for(const value of ['vertical','horizontal'])$(value).onclick=()=>{direction=value;for(const d of ['vertical','horizontal']){$(d).classList.toggle('active',d===value);$(d).setAttribute('aria-pressed',String(d===value));}clearOutputs();updateNamePreview();message('');};
for (const id of ['output-name', 'number-offset']) {
  $(id).oninput = () => { clearOutputs(); updateControls(); message(''); };
}
$('group-size').oninput=()=>{clearOutputs();renderQueue();message('');};
/** Encode sequentially to bound decoded-image memory; never crop or rescale. */
$('generate').onclick=async()=>{clearOutputs();setBusy(true);const groups=sortedGroups(images,groupSize()),errors=[];for(let index=0;index<groups.length;index++){message(`Joining group ${index+1} of ${groups.length}…`);const group=groups[index];const plan=layout(group,direction);let canvas;try{if(plan.width>16384||plan.height>16384||plan.width*plan.height>40000000)throw new Error('Output is too large. Try fewer images per group (maximum 16,384 px per side and 40 megapixels).');canvas=document.createElement('canvas');canvas.width=plan.width;canvas.height=plan.height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas is unavailable.');for(let i=0;i<group.length;i++){const image=new Image();image.src=group[i].url;await image.decode();ctx.drawImage(image,...plan.positions[i]);image.src='';}const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Could not encode this image.')),'image/png'));const name=outputFilename($('output-name').value,index,numberingOffset(),direction);outputs.push({name,blob,url:URL.createObjectURL(blob),width:plan.width,height:plan.height,sources:group.map(i=>i.name)});}catch(error){errors.push(`Group ${index+1}: ${error.message}`);}finally{if(canvas){canvas.width=1;canvas.height=1;}}}
for(const output of outputs){const card=element('article','result-card'),preview=element('div','result-preview'),image=element('img','');image.src=output.url;image.alt=`Joined images: ${output.sources.join(', ')}`;preview.append(image);const meta=element('div','result-meta'),link=element('a','','Download PNG ↓');link.href=output.url;link.download=output.name;meta.append(element('strong','',output.name),element('p','',`${output.width} × ${output.height} px · ${output.sources.join(' + ')}`),link);card.append(preview,meta);$('result-grid').append(card);}$('results').hidden=!outputs.length;$('result-summary').textContent=`${outputs.length} PNG image${outputs.length===1?'':'s'} · Original pixels, ready to download.`;setBusy(false);message(errors.length?`${outputs.length} created. ${errors.length} group(s) failed:\n${errors.join('\n')}`:`All done! ${outputs.length} joined image${outputs.length===1?'':'s'} ready.`,!!errors.length);};
$('bundle').onclick=async()=>{setBusy(true);message('Preparing your ZIP…');try{const blob=await makeZip(outputs);const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=safePrefix($('output-name').value)?`${safePrefix($('output-name').value)}.zip`:'pairwise-images.zip';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);message('ZIP ready. Your download has started.');}catch(error){message(error.message,true);}finally{setBusy(false);}};
updateControls();
