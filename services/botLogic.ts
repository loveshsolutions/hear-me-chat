// Simple rule-based supportive responses (ELIZA-style)
const RESPONSES = [
  { 
    keywords: ['hi', 'hello', 'hey', 'start', 'morning', 'evening'], 
    answers: [
      "Hello there. I'm here to listen.", 
      "Hi. How are you feeling right now?", 
      "Welcome. This is a safe space to share whatever is on your mind."
    ] 
  },
  { 
    keywords: ['sad', 'depressed', 'unhappy', 'cry', 'crying', 'tear', 'pain', 'hurt'], 
    answers: [
      "I'm sorry to hear you're feeling down. I'm here for you.", 
      "It's okay to feel sad sometimes. Do you want to talk about what's making you feel this way?", 
      "I hear you. You are not alone in this feeling.",
      "That sounds really heavy. I'm listening if you want to let it out."
    ] 
  },
  { 
    keywords: ['anx', 'panic', 'fear', 'scared', 'worry', 'worried', 'nervous'], 
    answers: [
      "Take a deep breath. I'm here with you.", 
      "Anxiety can be overwhelming. Try to focus on your breathing for a moment.", 
      "You are safe here. Tell me what's on your mind.",
      "It's understandable to feel scared. One step at a time."
    ] 
  },
  { 
    keywords: ['lonely', 'alone', 'nobody', 'friends'], 
    answers: [
      "You're not alone right now. I'm here.", 
      "Loneliness is a heavy feeling. I'm glad you reached out.", 
      "Connecting takes courage. I'm listening.",
      "Even if it feels like it, you aren't invisible. I see you."
    ] 
  },
  { 
    keywords: ['angry', 'mad', 'furious', 'hate'], 
    answers: [
      "It sounds like you're carrying a lot of frustration.", 
      "It's okay to be angry. Venting can help release that pressure.", 
      "What's making you feel this way?",
      "Let it out. I won't judge you."
    ] 
  },
  { 
    keywords: ['tired', 'exhausted', 'sleep', 'weary'], 
    answers: [
      "It sounds like you've been carrying a heavy load.", 
      "Rest is important, but for now, I'm here to support you.", 
      "It's okay to be tired. You've probably been being strong for too long."
    ] 
  },
  { 
    keywords: ['thanks', 'thank you'], 
    answers: [
      "You're welcome.", 
      "I'm glad I could be here for you.", 
      "Anytime. I'm not going anywhere."
    ] 
  },
  { 
    keywords: ['bye', 'goodbye', 'leave'], 
    answers: [
      "Goodbye. Please take care of yourself.", 
      "I'll be here if you need to talk again.", 
      "Stay safe."
    ] 
  },
];

const DEFAULT_ANSWERS = [
  "I hear you.",
  "Tell me more about that.",
  "How does that make you feel?",
  "I'm listening.",
  "Please go on.",
  "It sounds like you're going through a lot.",
  "I'm here for you.",
  "That sounds difficult.",
  "I appreciate you sharing that with me."
];

export function getBotResponse(input: string): string {
  const lowerInput = input.toLowerCase();
  
  for (const group of RESPONSES) {
    if (group.keywords.some(k => lowerInput.includes(k))) {
        return group.answers[Math.floor(Math.random() * group.answers.length)];
    }
  }
  
  return DEFAULT_ANSWERS[Math.floor(Math.random() * DEFAULT_ANSWERS.length)];
}