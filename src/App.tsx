import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/34adf976-fb61-4583-b3cd-d3f96a5bd7d2";

async function authApi(action: string, data: Record<string, string>) {
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  return res.json();
}

interface User {
  id: number;
  name: string;
  username: string;
  phone?: string;
  avatar_color: string;
  created_at: string;
}

type Screen = "login" | "register" | "chats" | "chat" | "contacts" | "profile" | "search" | "settings";

interface Message {
  id: number;
  text: string;
  out: boolean;
  time: string;
  encrypted?: boolean;
}

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  color: string;
}

interface Contact {
  id: number;
  name: string;
  username: string;
  avatar: string;
  online: boolean;
  color: string;
}

const CHATS: Chat[] = [
  { id: 1, name: "Алина Морозова", avatar: "А", lastMsg: "Окей, увидимся завтра!", time: "14:22", unread: 2, online: true, color: "#8B5CF6" },
  { id: 2, name: "Группа: Команда 🚀", avatar: "К", lastMsg: "Деплой прошёл успешно", time: "13:55", unread: 0, online: false, color: "#06B6D4" },
  { id: 3, name: "Дмитрий Захаров", avatar: "Д", lastMsg: "Посмотри задачу в трекере", time: "12:30", unread: 5, online: true, color: "#EC4899" },
  { id: 4, name: "Мария Соколова", avatar: "М", lastMsg: "Спасибо за помощь!", time: "вчера", unread: 0, online: false, color: "#D946EF" },
  { id: 5, name: "Иван Петров", avatar: "И", lastMsg: "Жду ответа по проекту", time: "вчера", unread: 1, online: true, color: "#F59E0B" },
  { id: 6, name: "Команда дизайна", avatar: "Д", lastMsg: "Новые макеты готовы", time: "пн", unread: 0, online: false, color: "#10B981" },
];

const MESSAGES: Message[] = [
  { id: 1, text: "Привет! Как дела?", out: false, time: "14:10", encrypted: true },
  { id: 2, text: "Всё отлично, работаем! А у тебя?", out: true, time: "14:11", encrypted: true },
  { id: 3, text: "Тоже хорошо 😊 Ты посмотрел документацию?", out: false, time: "14:15", encrypted: true },
  { id: 4, text: "Да, всё изучил. Сделаем к пятнице", out: true, time: "14:17", encrypted: true },
  { id: 5, text: "Отлично! Жду результат", out: false, time: "14:19", encrypted: true },
  { id: 6, text: "Окей, увидимся завтра!", out: false, time: "14:22", encrypted: true },
];

const CONTACTS: Contact[] = [
  { id: 1, name: "Алина Морозова", username: "@alina_m", avatar: "А", online: true, color: "#8B5CF6" },
  { id: 2, name: "Дмитрий Захаров", username: "@dmitry_z", avatar: "Д", online: true, color: "#EC4899" },
  { id: 3, name: "Мария Соколова", username: "@masha_s", avatar: "М", online: false, color: "#D946EF" },
  { id: 4, name: "Иван Петров", username: "@ivan_p", avatar: "И", online: true, color: "#F59E0B" },
  { id: 5, name: "Ксения Белова", username: "@ksenya_b", avatar: "К", online: false, color: "#10B981" },
  { id: 6, name: "Артём Волков", username: "@artem_v", avatar: "А", online: true, color: "#06B6D4" },
];

const BgOrbs = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    <div style={{ position:"absolute",top:"-20%",left:"-10%",width:500,height:500,background:"radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%)",borderRadius:"50%",filter:"blur(40px)",animation:"float 6s ease-in-out infinite" }} />
    <div style={{ position:"absolute",bottom:"10%",right:"-15%",width:400,height:400,background:"radial-gradient(circle,rgba(217,70,239,0.15) 0%,transparent 70%)",borderRadius:"50%",filter:"blur(40px)",animation:"float 8s ease-in-out infinite 2s" }} />
    <div style={{ position:"absolute",top:"50%",left:"40%",width:300,height:300,background:"radial-gradient(circle,rgba(6,182,212,0.1) 0%,transparent 70%)",borderRadius:"50%",filter:"blur(30px)",animation:"float 7s ease-in-out infinite 1s" }} />
  </div>
);

const Avatar = ({ letter, color, size = 44, online }: { letter: string; color: string; size?: number; online?: boolean }) => (
  <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
    <div
      className="flex items-center justify-center font-montserrat font-bold text-white"
      style={{ width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${color},${color}88)`,fontSize:size*0.38,boxShadow:`0 0 0 2px rgba(139,92,246,0.3),0 4px 12px ${color}44` }}
    >
      {letter}
    </div>
    {online !== undefined && (
      <div style={{ position:"absolute",bottom:1,right:1,width:size*0.26,height:size*0.26,borderRadius:"50%",background:online?"#22C55E":"#6B7280",border:"2px solid #0A0A0F" }} />
    )}
  </div>
);

function LoginScreen({ onLogin, onRegister }: { onLogin: (user: User, token: string) => void; onRegister: () => void }) {
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!login.trim() || !pass.trim()) { setError("Заполните все поля"); return; }
    setLoading(true);
    const res = await authApi("login", { login: login.trim(), password: pass });
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    localStorage.setItem("arku_token", res.token);
    onLogin(res.user, res.token);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden" style={{ background:"#0A0A0F" }}>
      <BgOrbs />
      <div className="w-full max-w-sm animate-slide-up z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 flex items-center justify-center rounded-3xl mb-4 animate-pulse-glow" style={{ background:"linear-gradient(135deg,#7C3AED,#D946EF,#06B6D4)" }}>
            <span className="font-montserrat font-black text-white text-3xl">A</span>
          </div>
          <h1 className="font-montserrat font-black text-3xl text-white mb-1">Arkumesenger</h1>
          <p className="text-sm" style={{ color:"#6B7280" }}>Защищённое общение нового поколения</p>
        </div>

        <div className="rounded-2xl p-6 space-y-4" style={{ background:"#111118",border:"1px solid rgba(139,92,246,0.2)" }}>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color:"#9CA3AF" }}>Имя пользователя или телефон</label>
            <input value={login} onChange={e=>setLogin(e.target.value)} placeholder="@username или +7..." className="w-full px-4 py-3 rounded-xl outline-none text-white font-golos" style={{ background:"#18181F",border:"1px solid rgba(139,92,246,0.2)",color:"#fff" }} onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color:"#9CA3AF" }}>Пароль</label>
            <div className="relative">
              <input type={showPass?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} placeholder="Введите пароль" className="w-full px-4 py-3 rounded-xl outline-none text-white font-golos" style={{ background:"#18181F",border:"1px solid rgba(139,92,246,0.2)",color:"#fff" }} onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
              <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={()=>setShowPass(!showPass)} style={{ color:"#6B7280" }}>
                <Icon name={showPass?"EyeOff":"Eye"} size={18} />
              </button>
            </div>
          </div>
          {error && <p className="text-xs rounded-lg px-3 py-2" style={{ background:"rgba(239,68,68,0.1)",color:"#F87171",border:"1px solid rgba(239,68,68,0.2)" }}>{error}</p>}
          <button onClick={handleLogin} disabled={loading} className="w-full py-3.5 rounded-xl font-montserrat font-bold text-white text-sm transition-all duration-300 hover:scale-[1.02] disabled:opacity-60" style={{ background:"linear-gradient(135deg,#7C3AED,#D946EF)",boxShadow:"0 0 20px rgba(124,58,237,0.4)" }}>
            {loading ? "Входим..." : "Войти"}
          </button>
        </div>

        <div className="flex items-center gap-2 my-5">
          <div className="flex-1 h-px" style={{ background:"rgba(139,92,246,0.2)" }} />
          <span className="text-xs" style={{ color:"#4B5563" }}>или</span>
          <div className="flex-1 h-px" style={{ background:"rgba(139,92,246,0.2)" }} />
        </div>

        <button onClick={onRegister} className="w-full py-3.5 rounded-xl font-montserrat font-semibold text-sm transition-all hover:scale-[1.02]" style={{ background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.3)",color:"#A78BFA" }}>
          Создать аккаунт
        </button>

        <p className="text-center text-xs mt-6 flex items-center justify-center gap-1.5" style={{ color:"#374151" }}>
          <Icon name="Lock" size={11} />
          Сквозное шифрование E2E
        </p>
      </div>
    </div>
  );
}

function RegisterScreen({ onBack, onDone }: { onBack: () => void; onDone: (user: User, token: string) => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inp = { background:"#18181F",border:"1px solid rgba(139,92,246,0.2)",color:"#fff" };

  const handleNext = async () => {
    setError("");
    if (step === 1) {
      if (!name.trim()) { setError("Введите имя"); return; }
      if (!username.trim() || username.trim().length < 3) { setError("Имя пользователя минимум 3 символа"); return; }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      if (!pass || pass.length < 6) { setError("Пароль минимум 6 символов"); return; }
      if (pass !== pass2) { setError("Пароли не совпадают"); return; }
      setLoading(true);
      const res = await authApi("register", { name: name.trim(), username: username.trim(), phone: phone.trim(), password: pass });
      setLoading(false);
      if (res.error) { setError(res.error); return; }
      localStorage.setItem("arku_token", res.token);
      onDone(res.user, res.token);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden" style={{ background:"#0A0A0F" }}>
      <BgOrbs />
      <div className="w-full max-w-sm animate-slide-up z-10">
        <button onClick={onBack} className="flex items-center gap-2 mb-6 text-sm hover:opacity-70 transition-opacity" style={{ color:"#A78BFA" }}>
          <Icon name="ArrowLeft" size={18} /><span>Назад</span>
        </button>
        <div className="flex gap-2 mb-8">
          {[1,2,3].map(i=>(
            <div key={i} className="h-1 rounded-full flex-1 transition-all duration-500" style={{ background:i<=step?"linear-gradient(90deg,#7C3AED,#D946EF)":"rgba(139,92,246,0.15)" }} />
          ))}
        </div>
        <div className="mb-6">
          <h2 className="font-montserrat font-black text-2xl text-white mb-1">
            {step===1?"Как вас зовут?":step===2?"Контакты":"Придумайте пароль"}
          </h2>
          <p className="text-sm" style={{ color:"#6B7280" }}>Шаг {step} из 3</p>
        </div>

        <div className="rounded-2xl p-6 space-y-4 animate-fade-in" style={{ background:"#111118",border:"1px solid rgba(139,92,246,0.2)" }}>
          {step===1&&<>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color:"#9CA3AF" }}>Имя и фамилия</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Иван Иванов" className="w-full px-4 py-3 rounded-xl outline-none font-golos" style={inp} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color:"#9CA3AF" }}>Имя пользователя</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-golos" style={{ color:"#8B5CF6" }}>@</span>
                <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="ivan_ivanov" className="w-full pl-8 pr-4 py-3 rounded-xl outline-none font-golos" style={inp} />
              </div>
            </div>
          </>}
          {step===2&&<div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color:"#9CA3AF" }}>Номер телефона</label>
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" className="w-full px-4 py-3 rounded-xl outline-none font-golos" style={inp} />
          </div>}
          {step===3&&<>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color:"#9CA3AF" }}>Пароль</label>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Минимум 6 символов" className="w-full px-4 py-3 rounded-xl outline-none font-golos" style={inp} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color:"#9CA3AF" }}>Повторите пароль</label>
              <input type="password" value={pass2} onChange={e=>setPass2(e.target.value)} placeholder="Повторите пароль" className="w-full px-4 py-3 rounded-xl outline-none font-golos" style={inp} onKeyDown={e=>e.key==="Enter"&&handleNext()} />
            </div>
          </>}
          {error && <p className="text-xs rounded-lg px-3 py-2" style={{ background:"rgba(239,68,68,0.1)",color:"#F87171",border:"1px solid rgba(239,68,68,0.2)" }}>{error}</p>}
          <button onClick={handleNext} disabled={loading} className="w-full py-3.5 rounded-xl font-montserrat font-bold text-white text-sm transition-all hover:scale-[1.02] disabled:opacity-60" style={{ background:"linear-gradient(135deg,#7C3AED,#D946EF)",boxShadow:"0 0 20px rgba(124,58,237,0.4)" }}>
            {loading ? "Создаём аккаунт..." : step<3 ? "Продолжить" : "Создать аккаунт"}
          </button>
        </div>
        <p className="text-center text-xs mt-6 flex items-center justify-center gap-1.5" style={{ color:"#374151" }}>
          <Icon name="Shield" size={11} />Данные защищены шифрованием AES-256
        </p>
      </div>
    </div>
  );
}

function BottomNav({ active, onChange }: { active: Screen; onChange: (s: Screen) => void }) {
  const items = [
    { screen:"chats" as Screen, icon:"MessageCircle", label:"Чаты" },
    { screen:"contacts" as Screen, icon:"Users", label:"Контакты" },
    { screen:"search" as Screen, icon:"Search", label:"Поиск" },
    { screen:"profile" as Screen, icon:"User", label:"Профиль" },
    { screen:"settings" as Screen, icon:"Settings2", label:"Настройки" },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2" style={{ background:"rgba(10,10,15,0.97)",borderTop:"1px solid rgba(139,92,246,0.15)",backdropFilter:"blur(20px)" }}>
      {items.map(item=>(
        <button key={item.screen} onClick={()=>onChange(item.screen)} className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl flex-1 transition-all duration-300" style={active===item.screen?{background:"rgba(139,92,246,0.2)",border:"1px solid rgba(139,92,246,0.4)"}:{border:"1px solid transparent"}}>
          <Icon name={item.icon} size={22} style={{ color:active===item.screen?"#A78BFA":"#4B5563" }} />
          <span className="text-xs font-golos font-medium" style={{ color:active===item.screen?"#A78BFA":"#4B5563" }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function ChatsScreen({ onChatOpen }: { onChatOpen: (chat: Chat) => void }) {
  return (
    <div className="flex flex-col h-full" style={{ background:"#0A0A0F" }}>
      <div className="px-5 pt-12 pb-4" style={{ borderBottom:"1px solid rgba(139,92,246,0.1)" }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-montserrat font-black text-2xl text-white">Сообщения</h1>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ background:"rgba(139,92,246,0.15)",border:"1px solid rgba(139,92,246,0.25)" }}>
            <Icon name="Edit" size={17} style={{ color:"#A78BFA" }} />
          </button>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background:"#18181F",border:"1px solid rgba(139,92,246,0.1)" }}>
          <Icon name="Search" size={16} style={{ color:"#4B5563" }} />
          <span className="text-sm font-golos" style={{ color:"#4B5563" }}>Поиск сообщений...</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-24">
        {CHATS.map((chat,i)=>(
          <button key={chat.id} onClick={()=>onChatOpen(chat)} className="w-full flex items-center gap-4 px-5 py-4 transition-all duration-200 hover:bg-white/[0.02] animate-fade-in" style={{ animationDelay:`${i*0.05}s`,borderBottom:"1px solid rgba(139,92,246,0.06)" }}>
            <Avatar letter={chat.avatar} color={chat.color} online={chat.online} />
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-golos font-semibold text-white text-sm truncate">{chat.name}</span>
                <span className="text-xs ml-2 flex-shrink-0" style={{ color:"#4B5563" }}>{chat.time}</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="Lock" size={10} style={{ color:"#8B5CF6",flexShrink:0 }} />
                <span className="text-xs truncate" style={{ color:"#6B7280" }}>{chat.lastMsg}</span>
                {chat.unread>0&&<span className="ml-auto flex-shrink-0 min-w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold font-montserrat text-white" style={{ background:"linear-gradient(135deg,#7C3AED,#D946EF)",padding:"0 6px" }}>{chat.unread}</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatScreen({ chat, onBack }: { chat: Chat; onBack: () => void }) {
  const [msgs, setMsgs] = useState<Message[]>(MESSAGES);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  const send = () => {
    if(!text.trim()) return;
    setMsgs(prev=>[...prev,{ id:Date.now(),text:text.trim(),out:true,time:new Date().toLocaleTimeString("ru",{hour:"2-digit",minute:"2-digit"}),encrypted:true }]);
    setText("");
  };

  return (
    <div className="flex flex-col h-full" style={{ background:"#0A0A0F" }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-4" style={{ background:"rgba(10,10,15,0.95)",borderBottom:"1px solid rgba(139,92,246,0.1)",backdropFilter:"blur(20px)" }}>
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl hover:scale-110 transition-transform" style={{ background:"rgba(139,92,246,0.15)" }}>
          <Icon name="ArrowLeft" size={18} style={{ color:"#A78BFA" }} />
        </button>
        <Avatar letter={chat.avatar} color={chat.color} size={38} online={chat.online} />
        <div className="flex-1">
          <p className="font-golos font-semibold text-white text-sm leading-tight">{chat.name}</p>
          <div className="flex items-center gap-1">
            <Icon name="Lock" size={10} style={{ color:"#8B5CF6" }} />
            <span className="text-xs" style={{ color:"#8B5CF6" }}>E2E шифрование</span>
          </div>
        </div>
        <button className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ background:"rgba(139,92,246,0.1)" }}><Icon name="Phone" size={17} style={{ color:"#A78BFA" }} /></button>
        <button className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ background:"rgba(139,92,246,0.1)" }}><Icon name="Video" size={17} style={{ color:"#A78BFA" }} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-28">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs" style={{ background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.2)",color:"#A78BFA" }}>
            <Icon name="ShieldCheck" size={13} />Чат защищён сквозным шифрованием
          </div>
        </div>
        {msgs.map((msg,i)=>(
          <div key={msg.id} className={`flex ${msg.out?"justify-end":"justify-start"} animate-fade-in`} style={{ animationDelay:`${i*0.03}s` }}>
            <div className="max-w-[78%] px-4 py-2.5" style={msg.out?{ background:"linear-gradient(135deg,#7C3AED,#D946EF)",borderRadius:"20px 20px 4px 20px",boxShadow:"0 4px 15px rgba(124,58,237,0.3)" }:{ background:"#18181F",border:"1px solid rgba(139,92,246,0.15)",borderRadius:"20px 20px 20px 4px" }}>
              <p className="text-sm font-golos text-white leading-relaxed">{msg.text}</p>
              <div className={`flex items-center gap-1 mt-1 ${msg.out?"justify-end":"justify-start"}`}>
                {msg.encrypted&&<Icon name="Lock" size={9} style={{ color:msg.out?"rgba(255,255,255,0.6)":"#8B5CF6" }} />}
                <span className="text-xs" style={{ color:msg.out?"rgba(255,255,255,0.6)":"#4B5563" }}>{msg.time}</span>
                {msg.out&&<Icon name="CheckCheck" size={13} style={{ color:"rgba(255,255,255,0.7)" }} />}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3" style={{ background:"rgba(10,10,15,0.97)",borderTop:"1px solid rgba(139,92,246,0.1)",backdropFilter:"blur(20px)" }}>
        <div className="flex items-end gap-3">
          <button className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl" style={{ background:"rgba(139,92,246,0.15)" }}><Icon name="Paperclip" size={18} style={{ color:"#A78BFA" }} /></button>
          <div className="flex-1 flex items-end rounded-2xl px-4 py-2.5" style={{ background:"#18181F",border:"1px solid rgba(139,92,246,0.2)" }}>
            <textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Сообщение..." rows={1} className="flex-1 bg-transparent outline-none resize-none text-sm font-golos text-white placeholder-gray-600" style={{ maxHeight:100 }} />
            <Icon name="Smile" size={18} style={{ color:"#4B5563",marginLeft:8,flexShrink:0 }} />
          </div>
          <button onClick={send} className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl transition-all hover:scale-110" style={{ background:"linear-gradient(135deg,#7C3AED,#D946EF)",boxShadow:"0 0 15px rgba(124,58,237,0.5)" }}>
            <Icon name="Send" size={17} style={{ color:"#fff" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactsScreen({ onChatStart }: { onChatStart: (c: Contact) => void }) {
  return (
    <div className="flex flex-col h-full" style={{ background:"#0A0A0F" }}>
      <div className="px-5 pt-12 pb-4" style={{ borderBottom:"1px solid rgba(139,92,246,0.1)" }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-montserrat font-black text-2xl text-white">Контакты</h1>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ background:"linear-gradient(135deg,#7C3AED,#D946EF)" }}>
            <Icon name="UserPlus" size={17} style={{ color:"#fff" }} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-5 py-3">
          <p className="text-xs font-montserrat font-semibold uppercase tracking-widest mb-3" style={{ color:"#4B5563" }}>Все контакты — {CONTACTS.length}</p>
          {CONTACTS.map((c,i)=>(
            <div key={c.id} className="flex items-center gap-4 py-3.5 animate-fade-in" style={{ animationDelay:`${i*0.05}s`,borderBottom:"1px solid rgba(139,92,246,0.06)" }}>
              <Avatar letter={c.avatar} color={c.color} size={48} online={c.online} />
              <div className="flex-1 min-w-0">
                <p className="font-golos font-semibold text-white text-sm">{c.name}</p>
                <p className="text-xs" style={{ color:"#8B5CF6" }}>{c.username}</p>
                <p className="text-xs" style={{ color:c.online?"#22C55E":"#4B5563" }}>{c.online?"В сети":"Не в сети"}</p>
              </div>
              <button onClick={()=>onChatStart(c)} className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-110" style={{ background:"rgba(139,92,246,0.15)",border:"1px solid rgba(139,92,246,0.25)" }}>
                <Icon name="MessageCircle" size={17} style={{ color:"#A78BFA" }} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchScreen() {
  const [query, setQuery] = useState("");
  const filtered = query.length>0 ? CHATS.filter(c=>c.name.toLowerCase().includes(query.toLowerCase())) : [];

  return (
    <div className="flex flex-col h-full" style={{ background:"#0A0A0F" }}>
      <div className="px-5 pt-12 pb-4">
        <h1 className="font-montserrat font-black text-2xl text-white mb-5">Поиск</h1>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background:"#18181F",border:"1px solid rgba(139,92,246,0.2)" }}>
          <Icon name="Search" size={18} style={{ color:"#8B5CF6" }} />
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск людей, чатов, сообщений..." className="flex-1 bg-transparent outline-none text-sm font-golos text-white placeholder-gray-600" autoFocus />
          {query&&<button onClick={()=>setQuery("")}><Icon name="X" size={16} style={{ color:"#4B5563" }} /></button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {!query&&(
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-20 h-20 flex items-center justify-center rounded-3xl mb-4" style={{ background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.2)" }}>
              <Icon name="Search" size={36} style={{ color:"#8B5CF6" }} />
            </div>
            <p className="font-golos text-base font-semibold text-white mb-1">Начните поиск</p>
            <p className="text-sm text-center" style={{ color:"#4B5563" }}>Введите имя контакта или ключевое слово</p>
          </div>
        )}
        {query&&filtered.length===0&&(
          <div className="flex flex-col items-center justify-center h-48">
            <p className="font-golos text-base font-semibold text-white mb-1">Ничего не найдено</p>
            <p className="text-sm" style={{ color:"#4B5563" }}>Попробуйте другой запрос</p>
          </div>
        )}
        {filtered.map((c,i)=>(
          <div key={c.id} className="flex items-center gap-4 py-4 animate-fade-in" style={{ animationDelay:`${i*0.05}s`,borderBottom:"1px solid rgba(139,92,246,0.06)" }}>
            <Avatar letter={c.avatar} color={c.color} size={44} online={c.online} />
            <div>
              <p className="font-golos font-semibold text-white text-sm">{c.name}</p>
              <p className="text-xs" style={{ color:"#6B7280" }}>{c.lastMsg}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileScreen({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const letter = user ? user.name.charAt(0).toUpperCase() : "Я";
  const regDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("ru", { month: "long", year: "numeric" })
    : "—";

  const handleLogout = async () => {
    const token = localStorage.getItem("arku_token");
    if (token) await authApi("logout", { token });
    localStorage.removeItem("arku_token");
    onLogout();
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24" style={{ background:"#0A0A0F" }}>
      <div className="relative h-44 flex-shrink-0" style={{ background:"linear-gradient(135deg,#7C3AED 0%,#D946EF 50%,#06B6D4 100%)" }}>
        <div className="absolute inset-0" style={{ background:"rgba(0,0,0,0.2)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-20" style={{ background:"linear-gradient(to bottom,transparent,#0A0A0F)" }} />
      </div>
      <div className="flex items-end gap-4 px-5 -mt-12 mb-5 relative z-10">
        <div className="w-24 h-24 flex items-center justify-center rounded-3xl font-montserrat font-black text-white text-4xl animate-pulse-glow" style={{ background:`linear-gradient(135deg,${user?.avatar_color || "#7C3AED"},${user?.avatar_color || "#D946EF"})`,border:"3px solid #0A0A0F",boxShadow:"0 0 30px rgba(124,58,237,0.5)" }}>{letter}</div>
        <div className="mb-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-montserrat font-black text-xl text-white">{user?.name || "Пользователь"}</h2>
          </div>
          <p className="text-sm" style={{ color:"#8B5CF6" }}>@{user?.username || "username"}</p>
        </div>
        <button className="mb-2 px-4 py-2 rounded-xl text-sm font-golos font-semibold" style={{ background:"rgba(139,92,246,0.15)",border:"1px solid rgba(139,92,246,0.3)",color:"#A78BFA" }}>Изменить</button>
      </div>

      <div className="grid grid-cols-3 gap-3 px-5 mb-6">
        {[{val:"0",label:"Контактов"},{val:"0",label:"Сообщений"},{val:"0",label:"Групп"}].map(s=>(
          <div key={s.label} className="text-center py-4 rounded-2xl" style={{ background:"#111118",border:"1px solid rgba(139,92,246,0.15)" }}>
            <p className="font-montserrat font-black text-xl gradient-text">{s.val}</p>
            <p className="text-xs mt-0.5" style={{ color:"#6B7280" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="px-5 space-y-3 mb-6">
        {[
          { icon:"Phone", val: user?.phone || "Телефон не указан" },
          { icon:"AtSign", val: `@${user?.username || "username"}` },
          { icon:"Calendar", val: `Регистрация: ${regDate}` },
        ].map(item=>(
          <div key={item.icon} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl" style={{ background:"#111118",border:"1px solid rgba(139,92,246,0.1)" }}>
            <div className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ background:"rgba(139,92,246,0.15)" }}>
              <Icon name={item.icon} size={17} style={{ color:"#A78BFA" }} />
            </div>
            <span className="text-sm font-golos" style={{ color:"#D1D5DB" }}>{item.val}</span>
          </div>
        ))}
      </div>

      <div className="px-5">
        <button onClick={handleLogout} className="w-full py-3.5 rounded-xl font-montserrat font-semibold text-sm transition-all hover:scale-[1.01]" style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",color:"#F87171" }}>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}

function SettingsScreen() {
  const [e2e, setE2e] = useState(true);
  const [notify, setNotify] = useState(true);
  const [twofa, setTwofa] = useState(false);

  const Toggle = ({ on, onChange }: { on: boolean; onChange: () => void }) => (
    <button onClick={onChange} className="relative w-12 h-6 rounded-full transition-all duration-300" style={{ background:on?"linear-gradient(135deg,#7C3AED,#D946EF)":"#18181F" }}>
      <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300" style={{ left:on?"calc(100% - 20px)":"4px",boxShadow:"0 2px 4px rgba(0,0,0,0.3)" }} />
    </button>
  );

  type SectionItem = { icon: string; label: string; desc?: string; toggle?: boolean; on?: boolean; onToggle?: () => void; danger?: boolean };
  const sections: { title: string; items: SectionItem[] }[] = [
    { title:"Безопасность", items:[
      { icon:"Lock",label:"E2E шифрование",desc:"Сквозное шифрование всех сообщений",toggle:true,on:e2e,onToggle:()=>setE2e(!e2e) },
      { icon:"ShieldCheck",label:"Двойная аутентификация",desc:"Дополнительная защита аккаунта",toggle:true,on:twofa,onToggle:()=>setTwofa(!twofa) },
      { icon:"KeyRound",label:"Смена пароля" },
    ]},
    { title:"Уведомления", items:[
      { icon:"Bell",label:"Push-уведомления",toggle:true,on:notify,onToggle:()=>setNotify(!notify) },
      { icon:"Volume2",label:"Звуки сообщений" },
    ]},
    { title:"Аккаунт", items:[
      { icon:"UserCog",label:"Редактировать профиль" },
      { icon:"Globe",label:"Язык интерфейса",desc:"Русский" },
      { icon:"Trash2",label:"Удалить аккаунт",danger:true },
    ]},
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24" style={{ background:"#0A0A0F" }}>
      <div className="px-5 pt-12 pb-5" style={{ borderBottom:"1px solid rgba(139,92,246,0.1)" }}>
        <h1 className="font-montserrat font-black text-2xl text-white">Настройки</h1>
      </div>
      <div className="px-5 py-4 space-y-6">
        {sections.map(section=>(
          <div key={section.title}>
            <p className="text-xs font-montserrat font-semibold uppercase tracking-widest mb-3 px-1" style={{ color:"#4B5563" }}>{section.title}</p>
            <div className="rounded-2xl overflow-hidden" style={{ border:"1px solid rgba(139,92,246,0.1)" }}>
              {section.items.map((item,i)=>(
                <div key={item.label} className="flex items-center gap-3 px-4 py-4 hover:bg-white/[0.02]" style={{ background:"#111118",borderBottom:i<section.items.length-1?"1px solid rgba(139,92,246,0.07)":undefined }}>
                  <div className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0" style={{ background:item.danger?"rgba(239,68,68,0.1)":"rgba(139,92,246,0.15)" }}>
                    <Icon name={item.icon} size={17} style={{ color:item.danger?"#F87171":"#A78BFA" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-golos font-medium" style={{ color:item.danger?"#F87171":"#E5E7EB" }}>{item.label}</p>
                    {item.desc&&<p className="text-xs mt-0.5" style={{ color:"#4B5563" }}>{item.desc}</p>}
                  </div>
                  {item.toggle ? <Toggle on={item.on!} onChange={item.onToggle!} /> : <Icon name="ChevronRight" size={16} style={{ color:"#374151" }} />}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="text-center py-4">
          <p className="text-xs" style={{ color:"#374151" }}>Arkumesenger v1.0.0</p>
          <p className="text-xs mt-1" style={{ color:"#1F2937" }}>Все данные защищены AES-256</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [activeTab, setActiveTab] = useState<Screen>("chats");
  const [openChat, setOpenChat] = useState<Chat | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("arku_token");
    if (!token) { setCheckingSession(false); return; }
    authApi("me", { token }).then(res => {
      if (res.user) {
        setCurrentUser(res.user);
        setScreen("chats");
        setActiveTab("chats");
      } else {
        localStorage.removeItem("arku_token");
      }
      setCheckingSession(false);
    }).catch(() => setCheckingSession(false));
  }, []);

  const handleTabChange = (s: Screen) => {
    setActiveTab(s);
    setScreen(s);
    setOpenChat(null);
  };

  const handleChatOpen = (chat: Chat) => {
    setOpenChat(chat);
    setScreen("chat");
  };

  const handleLogin = (user: User, _token: string) => {
    setCurrentUser(user);
    setScreen("chats");
    setActiveTab("chats");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setScreen("login");
    setOpenChat(null);
  };

  const showNav = !["login","register","chat"].includes(screen);

  if (checkingSession) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background:"#0A0A0F" }}>
        <BgOrbs />
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-16 h-16 flex items-center justify-center rounded-2xl animate-pulse-glow" style={{ background:"linear-gradient(135deg,#7C3AED,#D946EF,#06B6D4)" }}>
            <span className="font-montserrat font-black text-white text-2xl">A</span>
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor:"#8B5CF6",borderTopColor:"transparent" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden font-golos" style={{ background:"#0A0A0F" }}>
      <BgOrbs />
      <div className="relative z-10 h-full">
        {screen==="login"&&<LoginScreen onLogin={handleLogin} onRegister={()=>setScreen("register")} />}
        {screen==="register"&&<RegisterScreen onBack={()=>setScreen("login")} onDone={handleLogin} />}
        {!["login","register"].includes(screen)&&(
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden relative">
              {screen==="chats"&&<ChatsScreen onChatOpen={handleChatOpen} />}
              {screen==="chat"&&openChat&&<ChatScreen chat={openChat} onBack={()=>{setScreen("chats");setOpenChat(null);}} />}
              {screen==="contacts"&&<ContactsScreen onChatStart={c=>handleChatOpen({id:c.id,name:c.name,avatar:c.avatar,lastMsg:"",time:"",unread:0,online:c.online,color:c.color})} />}
              {screen==="search"&&<SearchScreen />}
              {screen==="profile"&&<ProfileScreen user={currentUser} onLogout={handleLogout} />}
              {screen==="settings"&&<SettingsScreen />}
            </div>
            {showNav&&<BottomNav active={activeTab} onChange={handleTabChange} />}
          </div>
        )}
      </div>
    </div>
  );
}