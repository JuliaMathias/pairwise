/** Pure ordering, layout, and ZIP encoding; no network or UI state. */
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
/** Natural ascending filename order, grouped in user-selected batches. */
export function sortedGroups(files, count=2) {
  if (!Number.isInteger(count) || count<2) throw new Error('Choose a whole number of at least 2 images per group.');
  const sorted = [...files].sort((a,b) => collator.compare(a.name,b.name));
  return Array.from({length: Math.ceil(sorted.length / count)}, (_,i) => sorted.slice(i*count,i*count+count));
}
/** Preserve original pixels; center smaller images along the shared axis. */
export function layout(images,direction) {
  const vertical=direction==='vertical';
  const cross=Math.max(...images.map(i=>vertical?i.width:i.height));
  let offset=0;
  const positions=images.map(image=>{const position=vertical?[Math.floor((cross-image.width)/2),offset]:[offset,Math.floor((cross-image.height)/2)];offset+=vertical?image.height:image.width;return position;});
  return {width:vertical?cross:offset,height:vertical?offset:cross,positions};
}
/** CRC-32 used by ZIP readers to verify each stored file. */
export function crc32(bytes) { let crc = 0xffffffff; for(const byte of bytes) {crc ^= byte; for(let i=0;i<8;i++) crc=(crc>>>1)^((crc&1)?0xedb88320:0);} return (crc^0xffffffff)>>>0; }
/** Build a standard uncompressed ZIP without third-party services or libraries. */
export async function makeZip(files) {
  const parts=[], directory=[]; let offset=0, size=0;
  const record=(length)=>{const bytes=new Uint8Array(length);return [bytes,new DataView(bytes.buffer)];};
  for(const file of files) {
    const name=new TextEncoder().encode(file.name), bytes=new Uint8Array(await file.blob.arrayBuffer());
    if(bytes.length>0xffffffff || offset+bytes.length>0xffffffff || files.length>65535) throw new Error('This bundle exceeds the ZIP size limit. Download images individually.');
    const crc=crc32(bytes), [local,l]=record(30); l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint16(12,33,true);l.setUint32(14,crc,true);l.setUint32(18,bytes.length,true);l.setUint32(22,bytes.length,true);l.setUint16(26,name.length,true);
    parts.push(local,name,bytes);
    const [central,c]=record(46); c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);c.setUint32(20,bytes.length,true);c.setUint32(24,bytes.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);
    directory.push(central,name);size+=46+name.length;offset+=30+name.length+bytes.length;
  }
  const [end,e]=record(22);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,size,true);e.setUint32(16,offset,true);
  return new Blob([...parts,...directory,end],{type:'application/zip'});
}
