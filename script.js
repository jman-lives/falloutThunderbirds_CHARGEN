function qs(id){return document.getElementById(id)}

function getFormData(){
  return {
    name: qs('name').value||null,
    age: parseInt(qs('age').value)||null,
    gender: qs('gender').value||null,
    attributes: {
      strength: Number(qs('strength').value)||0,
      perception: Number(qs('perception').value)||0,
      endurance: Number(qs('endurance').value)||0,
      charisma: Number(qs('charisma').value)||0,
      intelligence: Number(qs('intelligence').value)||0,
      agility: Number(qs('agility').value)||0,
      luck: Number(qs('luck').value)||0,
    },
    occupation: qs('occupation').value||null,
    notes: qs('notes').value||null,
    createdAt: new Date().toISOString()
  }
}

function setFormData(data){
  if(!data) return
  qs('name').value = data.name||''
  qs('age').value = data.age==null? '': data.age
  qs('gender').value = data.gender||''
  const a = data.attributes||{}
  qs('strength').value = a.strength||5
  qs('perception').value = a.perception||5
  qs('endurance').value = a.endurance||5
  qs('charisma').value = a.charisma||5
  qs('intelligence').value = a.intelligence||5
  qs('agility').value = a.agility||5
  qs('luck').value = a.luck||5
  qs('occupation').value = data.occupation||''
  qs('notes').value = data.notes||''
  renderOutput(getFormData())
}

function randInt(min,max){return Math.floor(Math.random()*(max-min+1))+min}

function randomizeCharacter(){
  const sampleNames = ['Alex','Riley','Mack','Nova','Harper','Jules','Casey','Rowan','Rex','Ivy']
  const genders = ['Male','Female','Non-binary','Other']
  const occupation = ['Scavenger','Engineer','Trader','Medic','Soldier','Mechanic','Scientist']
  const char = {
    name: sampleNames[randInt(0,sampleNames.length-1)],
    age: randInt(16,70),
    gender: genders[randInt(0,genders.length-1)],
    attributes: {
      strength: randInt(1,10),
      perception: randInt(1,10),
      endurance: randInt(1,10),
      charisma: randInt(1,10),
      intelligence: randInt(1,10),
      agility: randInt(1,10),
      luck: randInt(1,10),
    },
    occupation: occupation[randInt(0,occupation.length-1)],
    notes: ''
  }
  setFormData(char)
}

function downloadJSON(obj, filename){
  const blob = new Blob([JSON.stringify(obj,null,2)],{type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'character.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function renderOutput(obj){
  qs('output').textContent = JSON.stringify(obj,null,2)
}

function handleFileLoad(file){
  const reader = new FileReader()
  reader.onload = e => {
    try{
      const data = JSON.parse(e.target.result)
      setFormData(data)
      alert('Loaded character JSON')
    }catch(err){
      alert('Invalid JSON file')
    }
  }
  reader.readAsText(file)
}

document.addEventListener('DOMContentLoaded', ()=>{
  qs('randomize').addEventListener('click', randomizeCharacter)
  qs('download').addEventListener('click', ()=>{
    const obj = getFormData()
    downloadJSON(obj, (obj.name||'character') + '.json')
  })
  qs('load-file').addEventListener('change', (e)=>{
    const f = e.target.files && e.target.files[0]
    if(f) handleFileLoad(f)
    e.target.value = ''
  })
  qs('fill-sample').addEventListener('click', ()=>{
    const sample = {
      name: 'Sample Vault Dweller',
      age: 28,
      gender: 'Other',
      attributes: {strength:6,perception:7,endurance:5,charisma:4,intelligence:8,agility:6,luck:3},
      occupation: 'Vault Technician',
      notes: 'Ready for adventure.'
    }
    setFormData(sample)
  })

  // initial render
  renderOutput(getFormData())
})
