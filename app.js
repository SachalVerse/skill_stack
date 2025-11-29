// Skill Stacking frontend logic
(function(){
  const SKILL_MAP = {
    javascript: [
      {skill:'TypeScript', reason:'Adds static typing and scales JS projects', resources:[{title:'TypeScript Handbook',url:'https://www.typescriptlang.org/docs/'}] },
      {skill:'React', reason:'Build modern UIs with component patterns', resources:[{title:'React docs',url:'https://react.dev/'}]}
    ],
    react: [
      {skill:'Next.js', reason:'Server rendering and hybrid apps', resources:[{title:'Next.js',url:'https://nextjs.org/'}]},
      {skill:'GraphQL', reason:'Flexible API querying for complex UIs', resources:[{title:'Apollo GraphQL',url:'https://www.apollographql.com/'}]}
    ],
    python: [
      {skill:'Pandas', reason:'Data manipulation for analysis', resources:[{title:'Pandas docs',url:'https://pandas.pydata.org/'}]},
      {skill:'Docker', reason:'Containerize apps for reproducible environments', resources:[{title:'Docker',url:'https://docs.docker.com/'}]}
    ],
    sql: [
      {skill:'Data Modeling', reason:'Design efficient schemas and queries', resources:[{title:'Database Normalization',url:'https://en.wikipedia.org/wiki/Database_normalization'}]}
    ],
    aws: [
      {skill:'Kubernetes', reason:'Run containerized workloads at scale', resources:[{title:'Kubernetes',url:'https://kubernetes.io/'}]},
      {skill:'Terraform', reason:'Infrastructure as code for reproducibility', resources:[{title:'Terraform',url:'https://www.terraform.io/'}]}
    ],
    docker: [
      {skill:'Kubernetes', reason:'Orchestrate containers in production', resources:[{title:'Kubernetes',url:'https://kubernetes.io/'}]}
    ],
    git: [
      {skill:'CI/CD', reason:'Automate testing and deployments', resources:[{title:'GitHub Actions',url:'https://docs.github.com/actions'}]}
    ]
  };

  const GOAL_MAP = {
    frontend:['HTML','CSS','JavaScript','TypeScript','React','Accessibility','Performance Optimization'],
    backend:['Data Modeling','Databases','APIs','Security','Scalability','Testing'],
    fullstack:['JavaScript','APIs','Databases','DevOps','Testing','Cloud Basics'],
    data:['Python','Statistics','SQL','Machine Learning','Data Visualization','Pandas'],
    pm:['Communication','Product Design','Metrics','Roadmapping','Stakeholder Mgmt'],
    devops:['Linux','Networking','Docker','Kubernetes','Observability','Terraform']
  };

  const RESOURCE_LIBRARY = {
    'TypeScript':['https://www.typescriptlang.org/docs/'],
    'React':['https://react.dev/'],
    'Next.js':['https://nextjs.org/'],
    'GraphQL':['https://www.apollographql.com/'],
    'Pandas':['https://pandas.pydata.org/'],
    'Docker':['https://docs.docker.com/'],
    'Kubernetes':['https://kubernetes.io/'],
    'Terraform':['https://www.terraform.io/'],
    'GitHub Actions':['https://docs.github.com/actions']
  };

  // UI elements
  const form = document.getElementById('skill-form');
  const skillsInput = document.getElementById('skills');
  const goalSelect = document.getElementById('goal');
  const goalCustom = document.getElementById('goal-custom');
  const profRange = document.getElementById('proficiency');
  const profValue = document.getElementById('prof-value');
  const resultsEl = document.getElementById('results');
  const presetBtn = document.getElementById('preset-btn');
  const clearBtn = document.getElementById('clear-btn');
  const copyBtn = document.getElementById('copy-btn');
  const exportBtn = document.getElementById('export-btn');

  profRange.addEventListener('input', ()=> profValue.textContent = profRange.value);
  goalSelect.addEventListener('change', ()=>{
    if(goalSelect.value==='custom'){ goalCustom.style.display='block'; } else { goalCustom.style.display='none'; }
  });

  form.addEventListener('submit', (e)=>{ e.preventDefault(); runSuggest(); });
  presetBtn.addEventListener('click', loadPresets);
  clearBtn.addEventListener('click', clearForm);
  copyBtn.addEventListener('click', copyJSON);
  exportBtn.addEventListener('click', exportCSV);

  function parseSkills(raw){
    return raw.split(',').map(s=>s.trim()).filter(Boolean).map(s=>normalize(s));
  }

  function normalize(s){ return s.toLowerCase().replace(/\s+/g,' '); }

  function runSuggest(){
    const rawSkills = skillsInput.value || '';
    const skills = parseSkills(rawSkills);
    const goal = (goalSelect.value==='custom' && goalCustom.value.trim())? goalCustom.value.trim().toLowerCase() : goalSelect.value;
    const prof = parseInt(profRange.value,10);
    const style = document.getElementById('style').value;

    const suggestions = generateSuggestions(skills, goal, prof, style);
    renderSuggestions(suggestions);
  }

  function generateSuggestions(skills, goal, prof, style){
    const scores = new Map();
    const reasons = new Map();

    // Goal-based suggestions
    if(GOAL_MAP[goal]){
      GOAL_MAP[goal].forEach((g, idx)=>{
        const key = normalize(g);
        if(skills.includes(key)) return; // skip known
        const base = 30 - idx; // prioritize earlier items
        addScore(key, base, `Useful for the goal: ${g}`);
      });
    }

    // Skill-based suggestions
    skills.forEach(s=>{
      if(SKILL_MAP[s]){
        SKILL_MAP[s].forEach(item=>{
          const key = normalize(item.skill);
          if(skills.includes(key)) return;
          addScore(key, 20, `Complement of ${s}: ${item.reason}`);
        });
      }
      // small heuristic: suggest adjacent important tool
      if(s==='git') addScore('ci/cd',12,'CI/CD for automation');
    });

    // Proficiency adjustment: beginners should focus fundamentals
    if(prof<=2){
      ['fundamentals','statistics','databases','testing'].forEach((f,i)=> addScore(normalize(f), 8 - i, 'Good foundation for growth'));
    }

    // Convert scores to array
    const items = Array.from(scores.entries()).map(([skill,score])=>({skill,score,reason:reasons.get(skill)||'', resources:getResources(skill)}));

    items.sort((a,b)=>b.score - a.score);
    return items.slice(0,12);

    function addScore(skill, value, reason){
      const prev = scores.get(skill) || 0;
      scores.set(skill, prev + value);
      reasons.set(skill, (reasons.get(skill) ? reasons.get(skill) + ' | ' : '') + reason);
    }
  }

  function getResources(skill){
    const title = skill.charAt(0).toUpperCase() + skill.slice(1);
    const res = RESOURCE_LIBRARY[title] || [];
    return res.length? res.map(u=>({title:title, url:u})) : [];
  }

  function renderSuggestions(list){
    if(!list.length){ resultsEl.innerHTML = '<p class="hint">No suggestions found — try adding more current skills or a clearer goal.</p>'; return; }
    resultsEl.innerHTML = '';
    list.forEach(item=>{
      const el = document.createElement('div'); el.className='result';
      const left = document.createElement('div'); left.className='left';
      const title = document.createElement('div'); title.innerHTML = `<strong>${capitalize(item.skill)}</strong> <span class="tag">score ${Math.round(item.score)}</span>`;
      const reason = document.createElement('div'); reason.className='reason'; reason.textContent = item.reason;
      left.appendChild(title); left.appendChild(reason);
      if(item.resources && item.resources.length){
        const res = document.createElement('div'); res.className='resources';
        item.resources.forEach(r=>{
          const a = document.createElement('a'); a.href = r.url; a.textContent = r.title; a.target='_blank'; res.appendChild(a);
        });
        left.appendChild(res);
      }
      const right = document.createElement('div'); right.className='right';
      const btn = document.createElement('button'); btn.textContent='Mark +'; btn.addEventListener('click', ()=>{ navigator.clipboard?.writeText(item.skill).then(()=>btn.textContent='Copied'); setTimeout(()=>btn.textContent='Mark +',600); });
      right.appendChild(btn);
      el.appendChild(left); el.appendChild(right);
      resultsEl.appendChild(el);
    });
  }

  function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  function loadPresets(){
    const presets = {
      'Frontend Developer':{skills:'HTML, CSS, JavaScript, Git', goal:'frontend'},
      'Data Scientist':{skills:'Python, SQL, Statistics', goal:'data'},
      'DevOps':{skills:'Linux, Docker, Git', goal:'devops'}
    };
    const names = Object.keys(presets).join('\n');
    const pick = prompt('Pick preset by exact name:\n' + names);
    if(!pick) return;
    if(presets[pick]){
      skillsInput.value = presets[pick].skills;
      goalSelect.value = presets[pick].goal;
      goalSelect.dispatchEvent(new Event('change'));
    } else alert('Preset not found — try exact name from list.');
  }

  function clearForm(){ skillsInput.value=''; goalSelect.value='frontend'; goalCustom.value=''; profRange.value=3; profValue.textContent='3'; resultsEl.innerHTML='<p class="hint">Fill the form and click "Suggest Skills" to get personalized recommendations.</p>' }

  function copyJSON(){
    const nodes = Array.from(resultsEl.querySelectorAll('.result'));
    const data = nodes.map(n=>({skill:n.querySelector('strong')?.textContent || '', reason:n.querySelector('.reason')?.textContent || ''}));
    navigator.clipboard?.writeText(JSON.stringify(data, null, 2)).then(()=> alert('Results copied to clipboard'));
  }

  function exportCSV(){
    const nodes = Array.from(resultsEl.querySelectorAll('.result'));
    const rows = nodes.map(n=>{
      const skill = (n.querySelector('strong')?.textContent || '').replace(/,/g,'');
      const reason = (n.querySelector('.reason')?.textContent || '').replace(/,/g,'');
      return `${skill},${reason}`;
    });
    const csv = 'Skill,Reason\n' + rows.join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'skill-suggestions.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  // expose to console for quick testing
  window.skillStack = {generateSuggestions};

})();
