import { CreateMLCEngine } from './libs/webllm.js';

const SELECTED_MODEL = "Llama-3.2-1B-Instruct-q4f32_1-MLC"; // Requires ~800MB VRAM

let engine;
const chatLog = document.getElementById("chatLog");
const userInput = document.getElementById("userInput");
const btnInit = document.getElementById("btnInit");
const status = document.getElementById("status");

function appendMsg(role, text, color) {
    const el = document.createElement("div");
    el.style.marginBottom = "15px";
    el.innerHTML = <strong style="color:">:</strong> <span style="line-height:1.4;"></span>;
    chatLog.appendChild(el);
    chatLog.scrollTop = chatLog.scrollHeight;
    return el;
}

btnInit.addEventListener("click", async () => {
    btnInit.disabled = true;
    if (!navigator.gpu) {
        status.textContent = "Error: WebGPU no está disponible en tu navegador. Intenta actualizar Chrome o revisa la configuración de tu tarjeta gráfica.";
        return;
    }
    
    try {
        status.style.color = "#d2a8ff";
        status.textContent = "Cargando motor WebGPU... (Manten esta pestaña abierta)";
        
        engine = await CreateMLCEngine(
            SELECTED_MODEL,
            { initProgressCallback: (info) => {
                status.textContent = Progreso: ;
            }}
        );
        status.style.color = "#3fb950";
        status.textContent = "¡Modelo cargado! Ya puedes pedirle que analice textos complejos.";
        userInput.disabled = false;
        userInput.focus();
        appendMsg("Sistema", "El modelo Llama-3.2 está listo para razonar sobre cualquier texto que le des.", "#8b949e");
    } catch(err) {
        status.style.color = "#ff7b72";
        status.textContent = Error: ;
        btnInit.disabled = false;
    }
});

userInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter" && userInput.value.trim()) {
        const text = userInput.value.trim();
        userInput.value = "";
        userInput.disabled = true;
        appendMsg("Tú", text, "#c9d1d9");
        
        try {
            const chunks = await engine.chat.completions.create({
                messages: [{ role: "user", content: text }],
                stream: true,
            });
            
            let reply = "";
            const el = document.createElement("div");
            el.style.marginBottom = "15px";
            chatLog.appendChild(el);
            
            for await (const chunk of chunks) {
                reply += chunk.choices[0]?.delta?.content || "";
                el.innerHTML = <strong style="color:#58a6ff">Llama-3:</strong> <span style="line-height:1.4;"></span>;
                chatLog.scrollTop = chatLog.scrollHeight;
            }
        } catch(err) {
            appendMsg("Error", err.message, "#ff7b72");
        }
        userInput.disabled = false;
        userInput.focus();
    }
});
