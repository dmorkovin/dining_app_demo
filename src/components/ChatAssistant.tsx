import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your dining assistant. How can I help you today?",
      sender: 'bot',
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const quickReplies = [
    "Today's menu",
    'Allergens',
    'Hours',
    'Points',
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    setTimeout(() => {
      const botResponse = getBotResponse(text);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: botResponse,
          sender: 'bot',
        },
      ]);
    }, 500);
  };

  const getBotResponse = (userText: string): string => {
    const lower = userText.toLowerCase();

    if (lower.includes('menu') || lower.includes('today')) {
      return "Today's featured dish is BBQ Chicken with Mac & Cheese! We also have Veggie Burgers and Sweet Potato Fries available.";
    }
    if (lower.includes('allergen')) {
      return 'You can manage your allergen alerts in the Menus tab under Allergens. Currently alerting you for: Nuts.';
    }
    if (lower.includes('hour')) {
      return 'We\'re open Monday-Friday: Breakfast 7-10am, Lunch 11:30am-2pm, Dinner 5-8pm. Weekend Brunch: 9am-2pm.';
    }
    if (lower.includes('point')) {
      return 'You currently have 1,240 points! You\'re only 260 points away from Platinum tier. Keep earning!';
    }

    return "I can help you with menu information, allergens, hours, and rewards. What would you like to know?";
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-5 z-40 w-14 h-14 bg-[var(--color-orange)] text-white rounded-full shadow-lg hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-40 right-5 z-40 w-[calc(100vw-2.5rem)] max-w-[390px] h-[420px] bg-white rounded-[14px] card-shadow-lg flex flex-col">
          <div className="bg-[var(--color-navy)] text-white p-4 rounded-t-[14px]">
            <h3 className="font-bold">Dining Assistant</h3>
            <p className="text-xs text-white/70 mt-0.5">Online now</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-[var(--color-navy)] text-white'
                      : 'bg-gray-100 text-[var(--color-navy)]'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-2 mb-3">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleSend(reply)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full hover:bg-gray-200 transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-orange)] text-sm"
                style={{ fontSize: '16px' }}
              />
              <button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim()}
                className="px-4 py-2 bg-[var(--color-orange)] text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
