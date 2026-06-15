import ReactMarkdown from 'react-markdown';

export default function ChatBubble({ role, text, isMarkdown = false }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm
          ${isUser
            ? 'bg-blue-600 text-white'
            : 'bg-slate-100 text-slate-800'
          }`}
      >
        {isMarkdown && !isUser ? (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{text}</p>
        )}
      </div>
    </div>
  );
}
