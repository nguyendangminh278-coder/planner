import test from 'node:test';import assert from 'node:assert/strict';import {mobileRecords,reminderCatalog} from '../src/lib/mobileAgenda.js';
test('native snapshot excludes third-party feeds, notes, user metadata and completed-state backups',()=>{
 const own={id:'t',title:'Own',start:'2026-10-08',end:'2026-10-09',ownerId:'private-id',details:'secret note',taskCompletionBackup:{progress:20},steps:[{id:'s',title:'Step',details:'secret step',progress:100}]};
 const source=mobileRecords([{id:'e',title:'Own event',notes:'secret note'},{id:'peer',source:'shared'}],[own,{id:'external',source:'external'}]);
 assert.deepEqual(source.events,[{id:'e',title:'Own event'}]);assert.equal(source.tasks.length,1);assert.equal(source.tasks[0].details,undefined);assert.equal(source.tasks[0].ownerId,undefined);assert.deepEqual(source.tasks[0].steps,[{id:'s',title:'Step',progress:100}]);
});
test('reminder identities separate events, tasks and child steps and parent completion marks child complete',()=>{
 const catalog=reminderCatalog([{id:'same',title:'Event'}],[{id:'same',title:'Task',progress:100,steps:[{id:'step',title:'Child',progress:0}]}]);
 assert.deepEqual(catalog.map(row=>row.key),['events:same','tasks:same','steps:same/step']);assert.equal(catalog[2].completed,true);
});
