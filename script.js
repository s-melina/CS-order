(function(){
"use strict";
// --- catalog (trial prices, rial) ---
var CAT={
 blade:{n:"تیغه الماسه Silent Core",s:[[350,4200000],[400,5600000],[500,8900000]]},
 core:{n:"مته کرگیری الماسه",s:[[52,1800000],[72,2400000],[102,3600000]]},
 roller:{n:"غلتک کالیبره الماسه",s:[[150,12500000],[200,16800000]]},
 cup:{n:"کاسه الماسه سنگ‌زنی",s:[[100,1500000],[125,1900000],[180,3100000]]},
 pad:{n:"پد پولیش الماسه",s:[[100,350000],[125,480000]]},
 flange:{n:"فلنج تیغه",s:[[100,950000],[120,1250000]]}
};
var KEY="cutston_requests_v1";
var $=function(i){return document.getElementById(i)};
var fa=function(n){return Number(n).toLocaleString("fa-IR")};
var rial=function(n){return fa(n)+" ریال"};
var mm=function(n){return fa(n)+" میلی‌متر"};

// --- digit normalisation ---
function norm(s){return String(s==null?"":s).replace(/[۰-۹]/g,function(d){return "۰۱۲۳۴۵۶۷۸۹".indexOf(d)}).replace(/[٠-٩]/g,function(d){return "٠١٢٣٤٥٦٧٨٩".indexOf(d)}).trim()}
function normMobile(v){var m=norm(v).replace(/[\s\-()]/g,"");
 if(/^(\+98|0098)\d{10}$/.test(m))m="0"+m.replace(/^(\+98|0098)/,"");
 else if(/^98\d{10}$/.test(m))m="0"+m.slice(2);
 else if(/^9\d{9}$/.test(m))m="0"+m;
 return m}

// --- setup selects ---
var pSel=$("product"),sSel=$("size");
function opt(v,t){var o=document.createElement("option");o.value=v;o.textContent=t;return o}
pSel.appendChild(opt("","انتخاب کنید"));
Object.keys(CAT).forEach(function(k){pSel.appendChild(opt(k,CAT[k].n))});
function fillSizes(){sSel.textContent="";var p=CAT[pSel.value];
 sSel.appendChild(opt("",p?"انتخاب کنید":"ابتدا محصول را انتخاب کنید"));
 if(p)p.s.forEach(function(x){sSel.appendChild(opt(String(x[0]),mm(x[0])+" — "+rial(x[1])))});}
fillSizes();

function unitPrice(){var p=CAT[pSel.value];if(!p)return null;
 for(var i=0;i<p.s.length;i++)if(String(p.s[i][0])===sSel.value)return p.s[i][1];return null}
function qtyVal(){var q=norm($("qty").value);return(/^\d+$/.test(q)&&+q>0&&+q<=100000)?+q:null}
function updateSum(){var u=unitPrice(),q=qtyVal();
 $("s-unit").textContent=u==null?"—":rial(u);
 $("s-qty").textContent=q==null?"—":fa(q);
 $("s-total").textContent=(u==null||q==null)?"—":rial(u*q)}

// --- validation ---
var MSG={company:"نام شرکت را وارد کنید.",mobile:"شمارهٔ موبایل درست نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹",city:"شهر را وارد کنید.",product:"یک محصول انتخاب کنید.",size:"یک سایز انتخاب کنید.",qty:"تعداد باید یک عدد صحیح و بیشتر از صفر باشد."};
var ORDER=["company","mobile","city","product","size","qty"];
function check(id){
 var v=$(id).value.trim();
 if(id==="company")return v.length>=2;
 if(id==="city")return v.length>=2;
 if(id==="mobile")return /^09\d{9}$/.test(normMobile(v));
 if(id==="product")return !!CAT[v];
 if(id==="size")return unitPrice()!=null;
 if(id==="qty"){var q=norm(v);return /^\d+$/.test(q)&&+q>0&&+q<=100000}
 return true}
function show(id,ok){var e=$("e-"+id),i=$(id);e.hidden=ok;e.textContent=ok?"":MSG[id];i.setAttribute("aria-invalid",ok?"false":"true")}
function validate(){var first=null;ORDER.forEach(function(id){var ok=check(id);show(id,ok);if(!ok&&!first)first=id});
 if(first)$(first).focus();return !first}
ORDER.forEach(function(id){var el=$(id);
 el.addEventListener("blur",function(){if(el.value!==""||el.dataset.touched)show(id,check(id))});
 el.addEventListener("input",function(){el.dataset.touched="1";if(el.getAttribute("aria-invalid")==="true")show(id,check(id))});
 el.addEventListener("change",function(){el.dataset.touched="1"})});
pSel.addEventListener("change",function(){fillSizes();updateSum();if($("size").getAttribute("aria-invalid")==="true")show("size",true)});
sSel.addEventListener("change",updateSum);
$("qty").addEventListener("input",updateSum);

// --- storage (browser only; swap for a server call later) ---
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
function load(){var raw=localStorage.getItem(KEY);if(!raw)return[];var a=JSON.parse(raw);if(!Array.isArray(a))throw new Error("bad data");return a.filter(function(r){return !r.sample})}
function newTracking(list){var d=new Date().toISOString().slice(2,10).replace(/-/g,""),t;
 do{t="CS-"+d+"-"+String(Math.floor(Math.random()*9000)+1000)}while(list.some(function(r){return r.tracking===t}));return t}
async function save(rec){
 await sleep(700);
 if(location.hash==="#fail")throw new Error("simulated failure");
 var list=load();
 var dup=list.filter(function(r){return r.id===rec.id})[0];
 if(dup)return dup;                       // same draft submitted twice -> same request
 rec.tracking=newTracking(list);
 list.unshift(rec);
 localStorage.setItem(KEY,JSON.stringify(list));
 return rec}
function uid(){return "r"+Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
var draftId=uid(),busy=false;

// --- submit ---
$("f").addEventListener("submit",async function(e){
 e.preventDefault();
 if(busy)return;
 if(!validate())return;
 var p=CAT[pSel.value],u=unitPrice(),q=qtyVal();
 var rec={id:draftId,company:$("company").value.trim(),name:$("name").value.trim(),mobile:normMobile($("mobile").value),city:$("city").value.trim(),
  productKey:pSel.value,productName:p.n,size:+sSel.value,qty:q,unitPrice:u,total:u*q,currency:"ریال",
  notes:$("notes").value.trim(),createdAt:new Date().toISOString(),status:"new",history:[]};
 busy=true;$("btn").disabled=true;
 var st=$("status");st.className="msg load";st.textContent="در حال ثبت درخواست…";
 try{
  var saved=await save(rec);
  st.className="";st.textContent="";
  $("f").reset();fillSizes();updateSum();
  ORDER.forEach(function(id){$(id).removeAttribute("aria-invalid");$("e-"+id).hidden=true;delete $(id).dataset.touched});
  draftId=uid();
  showDone(saved);
 }catch(err){
  st.className="msg bad";st.textContent="ثبت درخواست انجام نشد. اطلاعات شما حفظ شده است؛ لطفاً دوباره تلاش کنید.";
 }finally{busy=false;$("btn").disabled=false}
});

function showDone(r){
 $("d-track").textContent=r.tracking;
 $("d-info").textContent=r.productName+" — "+mm(r.size)+" — "+fa(r.qty)+" عدد — مبلغ اولیه "+rial(r.total);
 $("formView").hidden=true;$("doneView").hidden=false;$("doneView").focus();window.scrollTo(0,0)}
$("again").addEventListener("click",function(){$("doneView").hidden=true;$("formView").hidden=false;$("company").focus()});

// --- saved list ---
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
// --- sales tracking view ---
var ST={new:"جدید",active:"در حال پیگیری",cancelled:"لغوشده",final:"نهایی‌شده"};
var NEXT={new:["active","cancelled"],active:["final","cancelled"],final:[],cancelled:[]};
var sv={q:"",f:"all",sel:null,act:null,busy:false,show:false};
var SV=$("salesView");
var stOf=function(r){return ST[r.status]?r.status:"new"};
var tm=function(i){return new Date(i).toLocaleString("fa-IR",{dateStyle:"medium",timeStyle:"short"})};
var mob=function(m){return String(m).replace(/\d/g,function(d){return "۰۱۲۳۴۵۶۷۸۹"[d]})};
var badge=function(s){return el("span","bd bd-"+s,ST[s])};
function btn(t,c,fn){var b=el("button",c,t);b.type="button";b.addEventListener("click",fn);return b}

// every change is re-read from storage and written back; the screen only shows what was saved
async function change(id,to,extra){
 await sleep(600);
 if(location.hash==="#admin-fail")throw new Error("simulated failure");
 var list=load(),r=list.filter(function(x){return x.id===id})[0];
 if(!r)throw new Error("missing");
 var from=stOf(r);
 if(NEXT[from].indexOf(to)<0)throw new Error("stale");
 var ent={from:from,to:to,at:new Date().toISOString()};
 if(extra.reason){ent.reason=extra.reason;r.cancelReason=extra.reason}
 if(extra.finance){ent.finance=extra.finance;r.finance=extra.finance}
 r.history=(Array.isArray(r.history)?r.history:[]).concat([ent]);
 r.status=to;
 localStorage.setItem(KEY,JSON.stringify(list));
}
function run(r,to,extra,all,msg){
 if(sv.busy)return;sv.busy=true;
 all.forEach(function(b){b.disabled=true});
 msg.className="msg load";msg.textContent="در حال ذخیرهٔ تغییر وضعیت…";
 change(r.id,to,extra).then(function(){sv.busy=false;sv.act=null;renderSales()},function(){
  sv.busy=false;all.forEach(function(b){b.disabled=false});
  msg.className="msg bad";msg.textContent="تغییر وضعیت ذخیره نشد و وضعیت قبلی باقی ماند. دوباره تلاش کنید."})}

function renderSales(){
 SV.textContent="";var list;
 try{list=load()}catch(e){SV.appendChild(el("p","msg bad","خواندن درخواست‌ها ممکن نیست."));return}
 var r=sv.sel&&list.filter(function(x){return x.id===sv.sel})[0];
 if(r)renderDetail(r);else{sv.sel=null;renderListView(list)}}

function match(r){
 var s=stOf(r);if(sv.f!=="all"&&s!==sv.f)return false;
 var q=norm(sv.q).toLowerCase();if(!q)return true;
 var qd=q.replace(/\D/g,"").replace(/^0+/,"");
 return r.company.toLowerCase().indexOf(q)>=0||(qd.length>=3&&r.mobile.indexOf(qd)>=0)}

// --- Excel export ---
var dt=function(i){return new Date(i).toLocaleString("sv-SE")};
function rowsFor(list){
 return list.map(function(r){
  var s=stOf(r),h=Array.isArray(r.history)?r.history:[],last=h.length?h[h.length-1]:null,f=r.finance||{};
  return {"شمارهٔ پیگیری":r.tracking,"زمان ثبت":dt(r.createdAt),"نام شرکت":r.company,"نام شخص":r.name||"","موبایل":r.mobile,"شهر":r.city,
   "محصول":r.productName,"سایز (میلی‌متر)":r.size,"تعداد":r.qty,"قیمت هر عدد (ریال)":r.unitPrice,"مبلغ اولیه (ریال)":r.total,
   "وضعیت":ST[s],"توضیحات مشتری":r.notes||"","دلیل لغو":r.cancelReason||"","شمارهٔ تأیید مالی":f.ref||"","توضیح تأیید مالی":f.note||"",
   "زمان تأیید مالی":f.at?dt(f.at):"","آخرین تغییر وضعیت":last?dt(last.at):""}})}
function doExport(list){
 var data=rowsFor(list),keys=Object.keys(data[0]),name="cutston-requests-"+new Date().toISOString().slice(0,10);
 if(window.XLSX){
  var ws=XLSX.utils.json_to_sheet(data),wb=XLSX.utils.book_new();
  ws["!cols"]=keys.map(function(k){return {wch:Math.max(14,k.length+4)}});
  wb.Workbook={Views:[{RTL:true}]};
  XLSX.utils.book_append_sheet(wb,ws,"درخواست‌ها");
  XLSX.writeFile(wb,name+".xlsx");return "xlsx"}
 var q=function(v){v=String(v==null?"":v);return /[",\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
 var lines=[keys.map(q).join(",")].concat(data.map(function(r){return keys.map(function(k){return k==="موبایل"?q('="'+r[k]+'"'):q(r[k])}).join(",")}));
 var b=new Blob(["\ufeff"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");
 a.href=URL.createObjectURL(b);a.download=name+".csv";document.body.appendChild(a);a.click();a.remove();
 setTimeout(function(){URL.revokeObjectURL(a.href)},2000);return "csv"}

function note(t,m){sv.note={t:t,m:m};renderSales()}

function renderListView(list){
 var bar=el("div","bar"),back=el("a",null,"← فرم مشتری");back.href="#form";
 bar.append(el("h1",null,"بررسی و کنترل درخواست‌ها"),back);SV.appendChild(bar);
 var stats=el("div","stats");
 [["all","همه"]].concat(Object.keys(ST).map(function(k){return [k,ST[k]]})).forEach(function(x){
  var n=x[0]==="all"?list.length:list.filter(function(r){return stOf(r)===x[0]}).length;
  var b=el("button","st");b.type="button";b.setAttribute("aria-pressed",sv.f===x[0]?"true":"false");
  b.append(el("b",null,fa(n)),el("span",null,x[1]));
  b.addEventListener("click",function(){sv.f=x[0];sv.show=true;renderSales()});stats.appendChild(b)});
 SV.appendChild(stats);
 var tools=el("div","tools");
 // the export always uses the search/filter that is active at click time, and its label follows the list
 var ex=btn("","pri",function(){try{
   var rows=list.filter(match);if(!rows.length)return;
   var k=doExport(rows);note("ok",k==="xlsx"?"فایل اکسل ساخته شد.":"کتابخانهٔ اکسل بارگذاری نشد (اینترنت لازم است)؛ به‌جایش فایل CSV ساخته شد که با اکسل باز می‌شود.")}catch(e){note("bad","ساخت فایل خروجی انجام نشد.")}});
 function syncExport(){var n=list.filter(match).length;ex.textContent="خروجی اکسل ("+fa(n)+" درخواست)";ex.disabled=!n}
 syncExport();tools.appendChild(ex);
 SV.appendChild(tools);
 if(sv.note){SV.appendChild(el("div","msg "+(sv.note.t==="ok"?"load":"bad"),sv.note.m));sv.note=null}
 if(!list.length){var e=el("div","card");e.append(el("b",null,"هنوز درخواستی ثبت نشده است."),el("p","sub","وقتی مشتری فرم درخواست خرید را ثبت کند، اینجا نمایش داده می‌شود."));SV.appendChild(e);return}
 var q=document.createElement("input");
 q.type="search";q.placeholder="جست‌وجو: نام شرکت یا موبایل";q.value=sv.q;q.setAttribute("aria-label","جست‌وجو بر اساس نام شرکت یا موبایل");
 var w=el("div","f");w.appendChild(q);SV.appendChild(w);
 SV.appendChild(btn(sv.show?"پنهان‌کردن فهرست درخواست‌ها":"نمایش درخواست‌ها ("+fa(list.length)+")","pri tgl",function(){sv.show=!sv.show;renderSales()}));
 var res=el("div");res.setAttribute("aria-live","polite");SV.appendChild(res);
 function fill(){
  syncExport();
  res.textContent="";
  var m=list.filter(match);
  if(!m.length){var e2=el("div","card");e2.append(el("b",null,"نتیجه‌ای پیدا نشد."),el("p","sub","نام شرکت یا موبایل را بررسی کنید یا فیلتر وضعیت را تغییر دهید."));e2.appendChild(btn("پاک‌کردن جست‌وجو و فیلتر","sec",function(){sv.q="";sv.f="all";renderSales()}));res.appendChild(e2);return}
  res.appendChild(el("p","sub",fa(m.length)+" درخواست"));
  m.forEach(function(r){
   var b=el("button","rw");b.type="button";
   var l1=el("div","l1");l1.append(el("b","ltr",r.tracking),badge(stOf(r)));
   var l2=el("div","l2");l2.append(r.company+" · ",el("span","ltr",mob(r.mobile)));
   b.append(l1,l2,el("div","l3",r.productName+" — "+mm(r.size)+" — "+fa(r.qty)+" عدد — "+rial(r.total)));
   b.addEventListener("click",function(){sv.sel=r.id;sv.act=null;renderSales();window.scrollTo(0,0)});
   res.appendChild(b)})}
 q.addEventListener("input",function(){sv.q=q.value;
  if(!sv.show){sv.show=true;renderSales();var i=SV.querySelector("input");i.focus();i.setSelectionRange(i.value.length,i.value.length)}else fill()});
 if(sv.show)fill()}

function renderDetail(r){
 var s=stOf(r);
 SV.appendChild(btn("→ بازگشت به فهرست","back",function(){sv.sel=null;sv.act=null;renderSales()}));
 var c=el("div","card"),h=el("div","l1"),t=el("h1","ltr",r.tracking);t.style.margin="0";h.append(t,badge(s));c.appendChild(h);
 var dl=el("dl");
 var rows=[["شرکت",r.company],["نام شخص",r.name||"—"],["موبایل",mob(r.mobile)],["شهر",r.city],["محصول",r.productName],["سایز",mm(r.size)],["تعداد",fa(r.qty)],["قیمت هر عدد (زمان ثبت)",rial(r.unitPrice)],["مبلغ اولیه",rial(r.total)],["توضیحات مشتری",r.notes||"—"],["زمان ثبت",tm(r.createdAt)]];
 if(s==="cancelled"&&r.cancelReason)rows.push(["دلیل لغو",r.cancelReason]);
 if(s==="final"&&r.finance)rows.push(["شمارهٔ تأیید مالی",r.finance.ref||"—"],["توضیح تأیید مالی",r.finance.note||"—"],["زمان تأیید مالی",tm(r.finance.at)]);
 rows.forEach(function(x){dl.append(el("dt",null,x[0]),el("dd",null,x[1]))});
 c.appendChild(dl);SV.appendChild(c);
 SV.appendChild(actions(r,s));
 var hc=el("div","card");hc.appendChild(el("h2","t","سابقهٔ وضعیت"));
 var ol=el("ol","tl");
 var items=[{txt:"ثبت درخواست ("+ST.new+")",at:r.createdAt}].concat((r.history||[]).map(function(x){
  return {txt:"از «"+ST[x.from]+"» به «"+ST[x.to]+"»",at:x.at,note:x.reason?"دلیل لغو: "+x.reason:x.finance?"تأیید مالی: "+[x.finance.ref,x.finance.note].filter(Boolean).join(" — "):""}}));
 items.forEach(function(i){var li=el("li",null,i.txt);li.appendChild(el("small",null,tm(i.at)));if(i.note)li.appendChild(el("small",null,i.note));ol.appendChild(li)});
 hc.appendChild(ol);SV.appendChild(hc)}

function field(c,id,label,tag){var d=el("div","f"),l=el("label",null,label),i=document.createElement(tag||"input");l.htmlFor=id;i.id=id;d.append(l,i);d.style.marginTop="14px";c.appendChild(d);return i}
function actions(r,s){
 var c=el("div","card");c.appendChild(el("h2","t","تغییر وضعیت"));
 if(!NEXT[s].length){c.appendChild(el("p","sub","این درخواست به پایان رسیده و وضعیت آن قابل تغییر نیست."));return c}
 var msg=el("div"),all=[],acts=el("div","acts");msg.setAttribute("role","status");
 function B(t,cls,fn,host){var b=btn(t,cls,fn);all.push(b);(host||acts).appendChild(b);return b}
 if(s==="new")B("شروع رسیدگی","pri",function(){run(r,"active",{},all,msg)});
 if(s==="active")B("تأیید مالی و نهایی‌کردن","pri",function(){sv.act="final";renderSales()});
 B("لغو درخواست","sec",function(){sv.act="cancel";renderSales()});
 c.appendChild(acts);
 function bad(inp,p,text){p.hidden=false;p.textContent=text;inp.setAttribute("aria-invalid","true");inp.focus()}
 if(sv.act==="cancel"){
  var ta=field(c,"cr","دلیل لغو","textarea"),er=el("p","err");er.hidden=true;er.setAttribute("role","alert");c.appendChild(er);
  var a2=el("div","acts");c.appendChild(a2);
  B("ثبت لغو","pri",function(){var v=ta.value.trim();if(v.length<3)return bad(ta,er,"دلیل لغو را بنویسید.");run(r,"cancelled",{reason:v},all,msg)},a2);
  B("انصراف","sec",function(){sv.act=null;renderSales()},a2);
 }else if(sv.act==="final"&&s==="active"){
  var fr=field(c,"fr","شمارهٔ تأیید مالی (آزمایشی)");fr.className="num";fr.placeholder="مثال: FIN-TEST-1001";
  var fn=field(c,"fn","توضیح تأیید مالی (آزمایشی)"),er2=el("p","err");er2.hidden=true;er2.setAttribute("role","alert");c.appendChild(er2);
  c.appendChild(el("p","sub","یکی از دو فیلد کافی است. زمان تأیید هنگام ثبت ذخیره می‌شود."));
  var a3=el("div","acts");c.appendChild(a3);
  B("ثبت تأیید و نهایی‌کردن","pri",function(){var a=fr.value.trim(),b=fn.value.trim();if(!a&&!b)return bad(fr,er2,"شمارهٔ تأیید یا توضیح تأیید مالی را وارد کنید.");run(r,"final",{finance:{ref:a,note:b,at:new Date().toISOString()}},all,msg)},a3);
  B("انصراف","sec",function(){sv.act=null;renderSales()},a3);
 }
 c.appendChild(msg);return c}

function route(){
 var s=/^#admin/.test(location.hash);
 document.querySelector(".wrap").classList.toggle("wide",s);
 SV.hidden=!s;$("nav").hidden=s;
 if(s){$("formView").hidden=true;$("doneView").hidden=true;sv.sel=null;sv.act=null;renderSales()}
 else{$("formView").hidden=false;$("doneView").hidden=true}}
window.addEventListener("hashchange",route);
updateSum();route();
})();
