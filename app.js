const STORAGE_KEY = "simple_course_v1";
const ADMIN_PASS_DEFAULT = "1234";
const state = load() || {
  courseTitle: "My Course",
  lessons: [{ title: "Welcome", url: "https://example.com/welcome.pdf" }],
  quiz: [{ q: "What does MAT stand for?",
           opts: ["Medical Assistance Training","Mobility Assistance Technician","Manual Access Transport","Medical Aid Team"],
           correct: 1 }],
  adminPass: ADMIN_PASS_DEFAULT
};

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; } }
function byId(id){ return document.getElementById(id); }
function h(tag, attrs={}, children=[]){
  const e=document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));
  (Array.isArray(children)?children:[children]).filter(Boolean).forEach(c=>{
    if(typeof c==="string") e.appendChild(document.createTextNode(c)); else e.appendChild(c);
  }); return e;
}

byId("year").textContent = new Date().getFullYear();
const tabLearner=byId("tab-learner"), tabAdmin=byId("tab-admin");
const viewLearner=byId("view-learner"), viewAdmin=byId("view-admin");
function show(tab){[tabLearner,tabAdmin].forEach(b=>b.classList.remove("active"));
 [viewLearner,viewAdmin].forEach(p=>p.classList.remove("active"));
 if(tab==="admin"){tabAdmin.classList.add("active");viewAdmin.classList.add("active");}
 else{tabLearner.classList.add("active");viewLearner.classList.add("active");}}
tabLearner.onclick=()=>show("learner"); tabAdmin.onclick=()=>show("admin");

function renderCourse(){
  byId("courseTitleHeader").textContent=state.courseTitle||"My Course";
  byId("courseTitle").textContent=state.courseTitle||"Course";
  const ul=byId("lessonList"); ul.innerHTML="";
  state.lessons.forEach(l=>ul.appendChild(h("li",{},[
    h("strong",{},l.title+" "), l.url?h("a",{href:l.url,target:"_blank",rel:"noopener"},"(open)"):""
  ])));
}
function renderAdmin(){
  byId("courseTitleInput").value=state.courseTitle||"";
  const ul=byId("lessonAdminList"); ul.innerHTML="";
  state.lessons.forEach((l,i)=>ul.appendChild(h("li",{},[
    `${l.title} `, l.url?h("a",{href:l.url,target:"_blank"},"link"):"(no link) ",
    " ", h("button",{class:"btn outline",style:"padding:4px 8px",onclick:()=>{state.lessons.splice(i,1);save();renderAdmin();renderCourse();}},"Delete")
  ])));
  const ql=byId("questionList"); ql.innerHTML="";
  state.quiz.forEach((q,i)=>ql.appendChild(h("li",{},[
    q.q," ",h("span",{class:"pill"},`Correct: ${["A","B","C","D"][q.correct]}`),
    " ",h("button",{class:"btn outline",style:"padding:4px 8px",onclick:()=>{state.quiz.splice(i,1);save();renderAdmin();}},"Delete")
  ])));
}
function renderQuiz(prepareOnly=false){
  const box=byId("quizBox"); box.innerHTML="";
  if(prepareOnly){byId("submitQuiz").disabled=true;return;}
  state.quiz.forEach((q,qi)=>{
    const wrap=h("div",{class:"card"}); wrap.appendChild(h("p",{},`${qi+1}. ${q.q}`));
    q.opts.forEach((opt,oi)=>wrap.appendChild(h("label",{},[
      h("input",{type:"radio",name:`q${qi}`,value:oi})," ",opt
    ]))); box.appendChild(wrap);
  }); byId("submitQuiz").disabled=false;
}
byId("startQuiz").onclick=()=>renderQuiz(false);
byId("submitQuiz").onclick=()=>{
  let score=0; state.quiz.forEach((q,qi)=>{
    const chosen=document.querySelector(`input[name="q${qi}"]:checked`);
    if(chosen && Number(chosen.value)===q.correct) score++;
  });
  const pct=Math.round((score/state.quiz.length)*100);
  byId("quizScore").textContent=`Score: ${score}/${state.quiz.length} (${pct}%)`;
};
const adminLocked=byId("adminLocked"), adminBody=byId("adminBody");
byId("unlock").onclick=()=>{
  const ok=byId("pass").value.trim()===(state.adminPass||"1234");
  if(ok){adminLocked.classList.add("hidden");adminBody.classList.remove("hidden");}
  else alert("Wrong passcode (default 1234).");
};
byId("saveCourse").onclick=()=>{state.courseTitle=byId("courseTitleInput").value.trim()||"My Course";save();renderCourse();};
byId("addLesson").onclick=()=>{
  const title=byId("lessonTitle").value.trim(), url=byId("lessonUrl").value.trim();
  if(!title) return alert("Enter a lesson title");
  state.lessons.push({title,url}); byId("lessonTitle").value=""; byId("lessonUrl").value="";
  save(); renderAdmin(); renderCourse();
};
byId("addQuestion").onclick=()=>{
  const q=byId("qText").value.trim();
  const opts=["optA","optB","optC","optD"].map(id=>byId(id).value.trim());
  const correct=Number(byId("correct").value);
  if(!q || opts.some(o=>!o)) return alert("Fill question + all 4 options.");
  state.quiz.push({q,opts,correct}); ["qText","optA","optB","optC","optD"].forEach(id=>byId(id).value="");
  save(); renderAdmin();
};
byId("exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob); const a=h("a",{href:url,download:"course.json"}); document.body.appendChild(a); a.click();
  setTimeout(()=>URL.revokeObjectURL(url),500);
};
byId("importBtn").onclick=()=>{
  const f=byId("importFile").files?.[0]; if(!f) return alert("Choose a JSON file first.");
  const r=new FileReader(); r.onload=()=>{ try{
    const data=JSON.parse(r.result); if(!data || !Array.isArray(data.lessons) || !Array.isArray(data.quiz)) throw 0;
    Object.assign(state,data); save(); renderCourse(); renderAdmin(); renderQuiz(true); alert("Imported!");
  }catch{ alert("Invalid file."); } }; r.readAsText(f);
};
renderCourse(); renderAdmin(); renderQuiz(true);
