const Product = require('../models/Product');

// ─── Gemini AI config ─────────────────────────────────────────────────────────
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `You are TechBot, the virtual assistant for TechLine Computers (Pvt) Ltd, a computer spare parts retailer based in Sri Lanka. You help customers with information about computer components including CPUs, GPUs, RAM, motherboards, storage devices, power supplies, cooling solutions, and peripherals. Provide helpful, accurate information about specifications, performance, compatibility, and recommendations. Keep responses concise (under 150 words) and friendly. Use bullet points for lists. If asked about specific prices at TechLine, suggest the user browse the store or ask about a specific product by name. Always be polite and professional. Do not discuss topics unrelated to computers and technology.`;

// ─── Keyword lists ────────────────────────────────────────────────────────────
const GREETINGS = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'sup', "what's up", 'greetings'];
const PRICE_KEYWORDS = ['price', 'cost', 'how much', 'pricing', 'rate', 'cheap', 'expensive', 'afford'];
const SPEC_KEYWORDS = ['spec', 'specification', 'performance', 'benchmark', 'details', 'feature', 'info', 'information', 'describe', 'description', 'review', 'good', 'worth'];
const STOCK_KEYWORDS = ['stock', 'available', 'availability', 'in stock', 'out of stock', 'have'];
const CATEGORY_KEYWORDS = ['category', 'categories', 'types', 'kind', 'what do you sell', 'what do you have', 'products', 'parts', 'components', 'list'];
const HELP_KEYWORDS = ['help', 'assist', 'support', 'what can you do', 'commands', 'options'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const containsAny = (msg, keywords) => keywords.some((k) => msg.includes(k));

function isGreeting(msg) {
  return GREETINGS.some((g) => msg === g || msg.startsWith(g + ' ') || msg.startsWith(g + '!') || msg.startsWith(g + ','));
}

// ─── Product search ───────────────────────────────────────────────────────────
async function searchProducts(msg) {
  const cleaned = msg
    .replace(/\b(price|cost|how|much|is|the|of|for|a|an|what|show|me|tell|about|spec|specification|performance|stock|available|availability|in|do|you|have|can|i|get|buy|purchase|details|info|information|please|thanks|thank)\b/g, '')
    .trim()
    .replace(/\s+/g, ' ');

  if (!cleaned) return [];

  let results = await Product.find({
    $or: [
      { name: { $regex: cleaned, $options: 'i' } },
      { code: { $regex: cleaned, $options: 'i' } },
      { description: { $regex: cleaned, $options: 'i' } },
    ],
    isActive: true,
  }).limit(5);

  if (results.length === 0) {
    const words = cleaned.split(/\s+/).filter((w) => w.length >= 3);
    for (const word of words) {
      results = await Product.find({
        $or: [
          { name: { $regex: word, $options: 'i' } },
          { code: { $regex: word, $options: 'i' } },
        ],
        isActive: true,
      }).limit(5);
      if (results.length > 0) break;
    }
  }
  return results;
}

// ─── Response formatters ──────────────────────────────────────────────────────
function formatPrice(products) {
  let s = '💰 Price Information:\n\n';
  for (const p of products) {
    s += `• ${p.name}\n  Code: ${p.code}\n  Price: Rs. ${p.unitPrice.toLocaleString()}\n  ${p.quantityInStock > 0 ? '✅ In Stock' : '❌ Out of Stock'}\n\n`;
  }
  return s.trim();
}

function formatSpec(products) {
  let s = '⚡ Product Details:\n\n';
  for (const p of products) {
    s += `🔧 ${p.name} (${p.code})\n`;
    if (p.description) s += `📝 ${p.description}\n`;
    s += `💰 Price: Rs. ${p.unitPrice.toLocaleString()}\n`;
    if (p.warrantyPeriod && p.warrantyPeriod > 0) s += `🛡️ Warranty: ${p.warrantyPeriod} year(s)\n`;
    s += '\n';
  }
  return s.trim();
}

function formatStock(products) {
  let s = '📦 Stock Availability:\n\n';
  for (const p of products) {
    const status = p.quantityInStock > 0 ? `✅ In Stock (${p.quantityInStock} units)` : '❌ Out of Stock';
    s += `• ${p.name} — ${status}\n`;
  }
  return s.trim();
}

function formatGeneral(products) {
  let s = '🔍 Here\'s what I found:\n\n';
  for (const p of products) {
    s += `• ${p.name} (${p.code})\n  💰 Rs. ${p.unitPrice.toLocaleString()} | ${p.quantityInStock > 0 ? '✅ In Stock' : '❌ Out of Stock'}\n`;
  }
  s += '\nAsk me for price, specs, or stock details on any product!';
  return s;
}

// ─── Gemini AI fallback ───────────────────────────────────────────────────────
async function askGemini(userMessage, contextPrefix) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return 'I\'m having trouble connecting to my knowledge base right now. Please try again later! 🔄';

  const prompt = contextPrefix ? `${contextPrefix} "${userMessage}"` : userMessage;

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
  };

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Gemini API returned ${res.status}`);

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || 'I received a response but couldn\'t process it. Please try rephrasing your question! 🔄';
}

// ─── Main controller ──────────────────────────────────────────────────────────
exports.chat = async (req, res) => {
  try {
    const userMessage = (req.body.message || '').trim();
    if (!userMessage) {
      return res.json({ success: true, reply: 'Please type a message so I can help you! 😊' });
    }

    const msg = userMessage.toLowerCase();

    // 1. Greetings
    if (isGreeting(msg)) {
      return res.json({
        success: true,
        reply:
          '👋 Hello! I\'m TechBot, your TechLine parts expert!\n\n' +
          'I can help you with:\n' +
          '• 💰 Product prices\n' +
          '• ⚡ Specs & performance info\n' +
          '• 📦 Stock availability\n' +
          '• 📋 Category browsing\n' +
          '• 🧠 General PC hardware advice\n\n' +
          'What would you like to know?',
      });
    }

    // 2. Help
    if (containsAny(msg, HELP_KEYWORDS)) {
      return res.json({
        success: true,
        reply:
          '🤖 TechBot Help\n\n' +
          'Here\'s what I can do:\n' +
          '• Ask about prices: "price of RTX 4070"\n' +
          '• Ask about specs: "specs of i7 processor"\n' +
          '• Check stock: "is DDR5 RAM in stock?"\n' +
          '• Browse categories: "show categories"\n' +
          '• General advice: "DDR4 vs DDR5?"\n' +
          '• Recommendations: "best GPU for gaming"\n\n' +
          'Just type your question naturally!',
      });
    }

    // 3. Category browsing
    if (containsAny(msg, CATEGORY_KEYWORDS)) {
      const categories = await Product.distinct('category', { isActive: true });
      if (categories.length === 0) {
        return res.json({ success: true, reply: '📋 No categories are set up yet. Please check back soon!' });
      }
      const catList = categories.map((c) => `• ${c}`).join('\n');
      return res.json({
        success: true,
        reply: `📋 Our Product Categories:\n\n${catList}\n\nAsk me about any category or product for more details!`,
      });
    }

    // 4. Product-specific queries
    const isPrice = containsAny(msg, PRICE_KEYWORDS);
    const isSpec = containsAny(msg, SPEC_KEYWORDS);
    const isStock = containsAny(msg, STOCK_KEYWORDS);

    if (isPrice || isSpec || isStock) {
      const found = await searchProducts(msg);
      if (found.length > 0) {
        let reply;
        if (isPrice) reply = formatPrice(found);
        else if (isStock) reply = formatStock(found);
        else reply = formatSpec(found);
        return res.json({ success: true, reply });
      }
      // Not in DB — fallback to Gemini
      const aiReply = await askGemini(
        userMessage,
        'A customer at TechLine Computers (Sri Lanka) asks about a product we don\'t currently have in our database. Provide general info and suggest they check back:'
      );
      return res.json({ success: true, reply: aiReply });
    }

    // 5. General product search
    const generalSearch = await searchProducts(msg);
    if (generalSearch.length > 0) {
      return res.json({ success: true, reply: formatGeneral(generalSearch) });
    }

    // 6. Gemini AI fallback
    const aiReply = await askGemini(userMessage);
    return res.json({ success: true, reply: aiReply });
  } catch (err) {
    console.error('Chatbot error:', err.message);
    return res.json({
      success: true,
      reply: 'I\'m temporarily unable to process your request. Please try again in a moment! 🔄',
    });
  }
};
