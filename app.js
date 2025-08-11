const btn = document.querySelector('.talk');
const content = document.querySelector('.content');
const voiceWave = document.getElementById('voiceWave');

if (!btn || !content || !voiceWave) {
    console.error("Required DOM elements missing. Make sure .talk, .content and #voiceWave exist in HTML.");
}

function createWaveBars(count = 5) {
    if (!voiceWave) return;
    voiceWave.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const bar = document.createElement('span');
        voiceWave.appendChild(bar);
    }
}
function clearWaveBars() {
    if (!voiceWave) return;
    voiceWave.innerHTML = '';
}

function speak(text) {
    if (!text) return;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    const ut = new SpeechSynthesisUtterance(text);
    ut.rate = 1;
    ut.pitch = 1;
    ut.volume = 1;
    createWaveBars();
    ut.onend = () => {
        clearWaveBars();
    };
    ut.onerror = (e) => {
        console.error("SpeechSynthesis error:", e);
        clearWaveBars();
    };
    window.speechSynthesis.speak(ut);
}

function wishMe() {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 12) speak("Good Morning Rishu...");
    else if (hour >= 12 && hour < 17) speak("Good Afternoon Boss...");
    else speak("Good Evening Rishu...");
}

window.addEventListener('load', () => {
    setTimeout(() => {
        speak("Initializing JARVIS..");
        wishMe();
    }, 300);
});

async function fetchWikiSummary(query) {
    if (!query) {
        speak("Please tell me the name of the person, place or thing.");
        return;
    }
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    try {
        const resp = await fetch(apiUrl);
        if (!resp.ok) {
            console.warn("Wiki response not ok:", resp.status);
            speak(`I couldn't find a Wikipedia summary for ${query}. I'll search it on Google.`);
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
            return;
        }
        const data = await resp.json();
        if (data.extract && data.extract.length > 0) {
            const shortText = data.extract.length > 850 ? data.extract.slice(0, 820) + "..." : data.extract;
            speak(shortText);
            console.log("Wiki summary:", data);
        } else {
            speak(`I could not find information about ${query} on Wikipedia. I'll search it on Google.`);
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
        }
    } catch (err) {
        console.error("Wiki fetch error:", err);
        speak("There was an error fetching information. I'll search on Google instead.");
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
    }
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

if (!SpeechRecognition) {
    alert("Speech Recognition not supported in this browser. Please use Google Chrome or Edge (desktop).");
    console.warn("SpeechRecognition API not available.");
} else {
    recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event) => {
        const lastIndex = event.resultIndex;
        const transcript = Array.from(event.results)
            .slice(lastIndex)
            .map(r => r[0].transcript)
            .join(' ')
            .trim();
        content.textContent = transcript || "Listening...";
        console.log("Transcript (interim/final):", transcript);
        if (event.results[event.results.length - 1].isFinal) {
            const finalText = event.results[event.results.length - 1][0].transcript.trim();
            console.log("Final recognized:", finalText);
            content.textContent = finalText;
            takeCommand(finalText.toLowerCase());
        }
    };

    recognition.onstart = () => {
        console.log("Recognition started - listening...");
        isListening = true;
        createWaveBars();
        content.textContent = "Listening....";
    };

    recognition.onend = () => {
        console.log("Recognition ended.");
        isListening = false;
        clearWaveBars();
    };

    recognition.onerror = (event) => {
        console.error("Recognition error:", event.error);
        isListening = false;
        clearWaveBars();
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            speak("Microphone permission denied. Please allow microphone access in your browser settings.");
        } else if (event.error === 'no-speech' || event.error === 'aborted') {
            speak("I couldn't hear anything. Please try again.");
        } else {
            speak("An error occurred with speech recognition: " + event.error);
        }
    };

    recognition.onnomatch = () => {
        console.log("No matching speech recognized.");
        speak("I didn't understand that. Could you please repeat?");
    };
}

btn.addEventListener('click', () => {
    if (!recognition) {
        speak("Speech recognition is not available in your browser.");
        return;
    }
    if (isListening) {
        try {
            recognition.stop();
        } catch (e) { console.warn("Error stopping recognition:", e); }
    } else {
        try {
            recognition.start();
        } catch (e) {
            console.error("Recognition start error:", e);
            speak("Sorry, I couldn't start listening right now. Try again.");
        }
    }
});

function openUrl(url, speakText = "") {
    window.open(url, "_blank");
    if (speakText) speak(speakText);
}

function takeCommand(message) {
    if (!message || message.trim().length === 0) {
        speak("Please say something.");
        return;
    }
    console.log("Processing command:", message);
    if (message.includes('hey') || message.includes('hello') || message.includes('hi')) {
        speak("Hey Rishu! How may I help you?");
        return;
    }
    if (message.includes("open google")) {
        openUrl("https://google.com", "Opening Google.");
        return;
    }
    if (message.includes("open youtube")) {
        openUrl("https://youtube.com", "Opening YouTube.");
        return;
    }
    if (message.includes("open photos") || message.includes("open google photos")) {
        openUrl("https://photos.google.com", "Opening Google Photos.");
        return;
    }
    if (message.includes("open facebook")) {
        openUrl("https://facebook.com", "Opening Facebook.");
        return;
    }
    if (message.includes('time')) {
        const t = new Date().toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
        speak("The time is " + t);
        return;
    }
    if (message.includes('date')) {
        const d = new Date().toLocaleString(undefined, { month: "short", day: "numeric" });
        speak("Today's date is " + d);
        return;
    }
    if (message.includes('calculator') || message.includes('calculate')) {
        openUrl("https://www.google.com/search?q=calculator", "Opening calculator on Google.");
        return;
    }
    const wikiTriggers = ['who is', 'what is', 'tell me about', 'tell about'];
    const foundTrigger = wikiTriggers.find(trigger => message.includes(trigger));
    if (foundTrigger) {
        let topic = message.replace(new RegExp(foundTrigger, 'i'), '').trim();
        if (!topic) {
            speak("Please say the name of the person, place or thing you want to know about.");
            return;
        }
        fetchWikiSummary(topic);
        return;
    }
    if (message.includes('wikipedia')) {
        const topic = message.replace(/wikipedia/gi, '').trim();
        if (!topic) {
            speak("Please say the topic you want from Wikipedia.");
            return;
        }
        fetchWikiSummary(topic);
        return;
    }
    const searchQuery = message.replace(/\s+/g, "+");
    openUrl(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, "I found some information for " + message + " on Google.");
}

