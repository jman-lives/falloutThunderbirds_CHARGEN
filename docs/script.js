function qs(id){return document.getElementById(id)}

function getFormData(){
  return {
    player: qs('player').value||null,
    name: qs('name').value||null,
    race: qs('race').value||null,
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
    skills: {
      guns: Number(qs('guns').value)||0,
      energy_weapons: Number(qs('energy_weapons').value)||0,
      unarmed: Number(qs('unarmed').value)||0,
      melee_weapons: Number(qs('melee_weapons').value)||0,
      throwing: Number(qs('throwing').value)||0,
      first_aid: Number(qs('first_aid').value)||0,
      doctor: Number(qs('doctor').value)||0,
      sneak: Number(qs('sneak').value)||0,
      lockpick: Number(qs('lockpick').value)||0,
      steal: Number(qs('steal').value)||0,
      traps: Number(qs('traps').value)||0,
      science: Number(qs('science').value)||0,
      repair: Number(qs('repair').value)||0,
      pilot: Number(qs('pilot').value)||0,
      speech: Number(qs('speech').value)||0,
      barter: Number(qs('barter').value)||0,
      gambling: Number(qs('gambling').value)||0,
      outdoorsman: Number(qs('outdoorsman').value)||0,
    },
    stats: {
      Hit_Points: Number(qs('hit_points').value)||0,
      Carry_Weight: Number(qs('carry_weight').value)||0,
      Action_Points: Number(qs('action_points').value)||0,
      Sequence: Number(qs('sequence').value)||0,
      Melee_Damage: Number(qs('melee_damage').value)||0,
      Critical_Chance: Number(qs('critical_chance').value)||0,
      Healing_Rate: Number(qs('healing_rate').value)||0,
      Poison_Resist: Number(qs('poison_resist').value)||0,
      Radiation_Resist: Number(qs('radiation_resist').value)||0,
      Gas_Resist: Number(qs('gas_resist').value)||0,
      Electricity_Resist: Number(qs('electricity_resist').value)||0,
      Armor_Class: Number(qs('armor_class').value)||0,
      DT: {
        Normal: Number(qs('dt_normal').value)||0,
        Laser: Number(qs('dt_laser').value)||0,
        Fire: Number(qs('dt_fire').value)||0,
        Plasma: Number(qs('dt_plasma').value)||0,
        Explode: Number(qs('dt_explode').value)||0,
      },
      DR: {
        Normal: Number(qs('dr_normal').value)||0,
        Laser: Number(qs('dr_laser').value)||0,
        Fire: Number(qs('dr_fire').value)||0,
        Plasma: Number(qs('dr_plasma').value)||0,
        Explode: Number(qs('dr_explode').value)||0,
      }
    },
    notes: qs('notes').value||null,
    createdAt: new Date().toISOString()
  }
}

function setFormData(data){
  if(!data) return
  qs('name').value = data.name||''
  qs('race').value = data.race||''
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
  const s = data.skills||{}
  qs('guns').value = s.guns||0
  qs('energy_weapons').value = s.energy_weapons||0
  qs('unarmed').value = s.unarmed||0
  qs('melee_weapons').value = s.melee_weapons||0
  qs('throwing').value = s.throwing||0
  qs('first_aid').value = s.first_aid||0
  qs('doctor').value = s.doctor||0
  qs('sneak').value = s.sneak||0
  qs('lockpick').value = s.lockpick||0
  qs('steal').value = s.steal||0
  qs('traps').value = s.traps||0
  qs('science').value = s.science||0
  qs('repair').value = s.repair||0
  qs('pilot').value = s.pilot||0
  qs('speech').value = s.speech||0
  qs('barter').value = s.barter||0
  qs('gambling').value = s.gambling||0
  qs('outdoorsman').value = s.outdoorsman||0
  const st = data.stats||{}
  qs('hit_points').value = st.Hit_Points||0
  qs('carry_weight').value = st.Carry_Weight||0
  qs('action_points').value = st.Action_Points||0
  qs('sequence').value = st.Sequence||0
  qs('melee_damage').value = st.Melee_Damage||0
  qs('critical_chance').value = st.Critical_Chance||0
  qs('healing_rate').value = st.Healing_Rate||0
  qs('poison_resist').value = st.Poison_Resist||0
  qs('radiation_resist').value = st.Radiation_Resist||0
  qs('gas_resist').value = st.Gas_Resist||0
  qs('electricity_resist').value = st.Electricity_Resist||0
  qs('armor_class').value = st.Armor_Class||0
  const dt = st.DT||{}
  qs('dt_normal').value = dt.Normal||0
  qs('dt_laser').value = dt.Laser||0
  qs('dt_fire').value = dt.Fire||0
  qs('dt_plasma').value = dt.Plasma||0
  qs('dt_explode').value = dt.Explode||0
  const dr = st.DR||{}
  qs('dr_normal').value = dr.Normal||0
  qs('dr_laser').value = dr.Laser||0
  qs('dr_fire').value = dr.Fire||0
  qs('dr_plasma').value = dr.Plasma||0
  qs('dr_explode').value = dr.Explode||0
  qs('notes').value = data.notes||''
  renderOutput(getFormData())
}

function randInt(min,max){return Math.floor(Math.random()*(max-min+1))+min}

function randomizeCharacter(){
  const sampleNames = ['Alex','Riley','Mack','Nova','Harper','Jules','Casey','Rowan','Rex','Ivy']
  const genders = ['Male','Female']
  const races = ['Human','Ghoul']
  const occupation = ['Scavenger','Engineer','Trader','Medic','Soldier','Mechanic','Scientist']
  const char = {
    name: sampleNames[randInt(0,sampleNames.length-1)],
    race: races[randInt(0,races.length-1)],
    age: randInt(16, races[randInt(0,races.length-1)] === 'Ghoul' ? 200 : 80),
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
    skills: {
      guns: randInt(0,100),
      energy_weapons: randInt(0,100),
      unarmed: randInt(0,100),
      melee_weapons: randInt(0,100),
      throwing: randInt(0,100),
      first_aid: randInt(0,100),
      doctor: randInt(0,100),
      sneak: randInt(0,100),
      lockpick: randInt(0,100),
      steal: randInt(0,100),
      traps: randInt(0,100),
      science: randInt(0,100),
      repair: randInt(0,100),
      pilot: randInt(0,100),
      speech: randInt(0,100),
      barter: randInt(0,100),
      gambling: randInt(0,100),
      outdoorsman: randInt(0,100),
    },
    stats: {
      Hit_Points: randInt(15,50),
      Carry_Weight: randInt(150,300),
      Action_Points: randInt(6,10),
      Sequence: randInt(1,20),
      Melee_Damage: randInt(1,10),
      Critical_Chance: randInt(0,50),
      Healing_Rate: randInt(0,5),
      Poison_Resist: randInt(0,50),
      Radiation_Resist: randInt(0,50),
      Gas_Resist: randInt(0,50),
      Electricity_Resist: randInt(0,50),
      Armor_Class: randInt(0,10),
      DT: {
        Normal: randInt(0,30),
        Laser: randInt(0,30),
        Fire: randInt(0,30),
        Plasma: randInt(0,30),
        Explode: randInt(0,30),
      },
      DR: {
        Normal: randInt(0,30),
        Laser: randInt(0,30),
        Fire: randInt(0,30),
        Plasma: randInt(0,30),
        Explode: randInt(0,30),
      }
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
  a.download = filename || `characterSheet_${obj.name || 'characterSheet'}.json`
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
      gender: 'Male',
      attributes: {strength:6,perception:7,endurance:5,charisma:4,intelligence:8,agility:6,luck:3},
      occupation: 'Vault Technician',
      notes: 'Ready for adventure.'
    }
    setFormData(sample)
  })

  // Dropdown change handlers
  qs('gender').addEventListener('change', (e) => {
    const selectedGender = e.target.value
    console.log('Gender selected:', selectedGender)
    renderOutput(getFormData())
  })

  qs('race').addEventListener('change', (e) => {
    const selectedRace = e.target.value
    console.log('Race selected:', selectedRace)
    
    const ageInput = qs('age')
    const currentAge = parseInt(ageInput.value) || 0
    
    if(selectedRace === 'Ghoul') {
      ageInput.max = '200'
    } else {
      ageInput.max = '80'
      // Clamp age to max if it exceeds the new max
      if(currentAge > 80) {
        ageInput.value = '80'
      }
    }
    
    renderOutput(getFormData())
  })

  // initial render
  renderOutput(getFormData())
})
