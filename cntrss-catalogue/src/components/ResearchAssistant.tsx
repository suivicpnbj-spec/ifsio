import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, DocumentItem, UserProfile } from '../types';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  BookOpen,
  FlaskConical,
  GraduationCap,
  FileText,
  Lightbulb,
  AlertCircle,
  History,
  Trash2
} from 'lucide-react';

interface ResearchAssistantProps {
  currentUser: UserProfile;
  contextDocument?: DocumentItem | null;
  onSelectDocument?: (doc: DocumentItem) => void;
}

const SUGGESTED_PROMPTS = [
  {
    label: 'Cadrage de mémoire Paludisme',
    prompt: 'Aide-moi à formuler une problématique et 3 objectifs spécifiques pour un mémoire de médecine sur le paludisme grave chez l\'enfant à Parakou.'
  },
  {
    label: 'Devis & Taille d\'échantillon',
    prompt: 'Quelle est la formule de Schwartz pour calculer la taille d\'un échantillon dans une étude transversale sur l\'hypertension avec une prévalence attendue de 25% et une précision de 5% ?'
  },
  {
    label: 'Plan type de stage',
    prompt: 'Donne-moi le plan type détaillé d\'un rapport de stage en sciences de santé et soins conforme aux exigences académiques nationales.'
  },
  {
    label: 'Revue bibliographique MeSH',
    prompt: 'Propose-moi les descripteurs MeSH français/anglais et une stratégie de recherche documentaire pour une thèse sur le diabète gestationnel au Bénin.'
  }
];

/** Un fil de discussion de l'assistant (titre = première question posée). */
interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}

function makeConversation(messages: ChatMessage[]): Conversation {
  const firstUser = messages.find((message) => message.role === 'user');
  return {
    id: `conv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: firstUser
      ? `${firstUser.content.slice(0, 48)}${firstUser.content.length > 48 ? '…' : ''}`
      : 'Nouvelle conversation',
    createdAt: Date.now(),
    messages
  };
}

/** Historique local des conversations (plusieurs fils, restaurés au montage). */
function loadConversations(storageKey: string, buildWelcome: () => ChatMessage): Conversation[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as Conversation[];
      if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0]?.messages)) {
        return parsed;
      }
    }
  } catch {
    // Historique illisible : on repart d'une conversation neuve.
  }
  return [makeConversation([buildWelcome()])];
}

export const ResearchAssistant: React.FC<ResearchAssistantProps> = ({
  currentUser,
  contextDocument
}) => {
  const buildWelcomeMessage = (): ChatMessage => ({
    id: `welcome-${Date.now().toString(36)}`,
    role: 'assistant',
    content: `Bonjour **${currentUser.fullName}** ! Je suis votre **Assistant IA de Recherche Médicale et Scientifique du CNTRSS**.

Je vous accompagne dans toutes les étapes de votre mémoire, thèse ou rapport de stage :
- **Affinement du thème** et formulation des questions de recherche
- **Choix méthodologique** (études transversales, cas-témoins, critères PICO, calcul d'échantillon)
- **Recherche documentaire & mots-clés MeSH**
- **Structuration du plan IMRAD** selon les normes de l'Université de Parakou, de la FSS et des instituts de santé.

Comment puis-je vous aider aujourd'hui ?`,
    timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    source: 'gemini'
  });

  const storageKey = `cntrss-assistant-conversations:${currentUser.id}`;

  // Historique des conversations : plusieurs fils d'échange conservés localement,
  // avec bascule entre eux, création d'une nouvelle conversation et suppression.
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadConversations(storageKey, buildWelcomeMessage)
  );
  const [activeId, setActiveId] = useState<string>(() => conversations[0]?.id ?? '');
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => conversations[0]?.messages ?? [buildWelcomeMessage()]
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Sauvegarde de l'historique (30 conversations maximum, 5 Mo de sécurité).
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(conversations.slice(0, 30)));
    } catch {
      // Quota dépassé ou navigation privée : l'historique reste en mémoire.
    }
  }, [conversations, storageKey]);

  // Les messages modifiés restent rattachés à la conversation active
  // (titre déduit de la première question posée).
  useEffect(() => {
    setConversations((prev) => {
      const index = prev.findIndex((conversation) => conversation.id === activeId);
      if (index === -1) return prev;
      const current = prev[index];
      if (current.messages === messages) return prev;
      const firstUser = messages.find((message) => message.role === 'user');
      const next = [...prev];
      next[index] = {
        ...current,
        messages,
        title: firstUser
          ? `${firstUser.content.slice(0, 48)}${firstUser.content.length > 48 ? '…' : ''}`
          : current.title
      };
      return next;
    });
  }, [messages, activeId]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText.trim(),
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          contextDoc: contextDocument
            ? {
                title: contextDocument.title,
                author: contextDocument.author,
                discipline: contextDocument.discipline,
                institution: contextDocument.institution
              }
            : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la requête');
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply || "Désolé, aucune réponse générée.",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        source: data.source
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: "Une difficulté de connexion est survenue. Veuillez vérifier votre réseau ou reformuler votre question.",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /** Démarre une nouvelle conversation (les précédentes restent consultables). */
  const handleResetChat = () => {
    const welcome = buildWelcomeMessage();
    const conversation = makeConversation([welcome]);
    setConversations((prev) => [conversation, ...prev]);
    setActiveId(conversation.id);
    setMessages([welcome]);
    setShowHistory(false);
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveId(conversation.id);
    setMessages(conversation.messages);
    setShowHistory(false);
  };

  const handleDeleteConversation = (id: string) => {
    const remaining = conversations.filter((conversation) => conversation.id !== id);

    if (remaining.length === 0) {
      const welcome = buildWelcomeMessage();
      const fresh = makeConversation([welcome]);
      setConversations([fresh]);
      setActiveId(fresh.id);
      setMessages([welcome]);
      return;
    }

    setConversations(remaining);
    if (id === activeId) {
      setActiveId(remaining[0].id);
      setMessages(remaining[0].messages);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[500px] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Assistant Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Assistant IA de Recherche Médicale
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-semibold">
                CNTRSS Scholar
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Accompagnement méthodologique, épidémiologique et rédaction scientifique
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          {contextDocument && (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-medium border border-sky-200 dark:border-sky-800">
              <BookOpen className="w-3.5 h-3.5" />
              Document actif : {contextDocument.title.substring(0, 28)}...
            </span>
          )}

          <button
            onClick={() => setShowHistory((prev) => !prev)}
            className={`p-2 rounded-xl transition-colors ${
              showHistory
                ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Historique des conversations"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetChat}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Démarrer une nouvelle conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {showHistory && (
            <div className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 p-2 space-y-1 text-xs">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Historique — {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
              </p>
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center gap-2 px-2 py-2 rounded-xl ${
                    conversation.id === activeId
                      ? 'bg-teal-50 dark:bg-teal-950/60'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <button
                    onClick={() => handleSelectConversation(conversation)}
                    className="flex-1 min-w-0 text-left"
                    title="Ouvrir cette conversation"
                  >
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {conversation.title}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(conversation.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}{' '}
                      · {conversation.messages.length} message{conversation.messages.length > 1 ? 's' : ''}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDeleteConversation(conversation.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                    title="Supprimer cette conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 space-y-2 leading-relaxed ${
                  isUser
                    ? 'bg-teal-600 text-white rounded-br-xs shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-bl-xs'
                }`}
              >
                {/* Content formatted with basic markdown rendering */}
                <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                  {msg.content}
                </div>

                {/* Footer with timestamp & copy button */}
                <div
                  className={`flex items-center justify-between pt-1 text-[10px] ${
                    isUser ? 'text-teal-100' : 'text-slate-400'
                  }`}
                >
                  <span className="font-mono">{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="hover:text-slate-700 dark:hover:text-slate-200 p-1 flex items-center gap-1 transition-colors"
                      title="Copier la réponse"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" /> Copié
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copier
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  {currentUser.avatarLetter}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 sm:gap-4 justify-start items-center">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-500 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
              <span>Analyse méthodologique en cours par le modèle médical...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Pills */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
        <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-500" /> Suggestions :
        </span>
        {SUGGESTED_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(p.prompt)}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 border border-slate-200 dark:border-slate-700 shrink-0 transition-colors font-medium"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez une question sur votre sujet, vos hypothèses, l'échantillonnage, la rédaction..."
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs shrink-0 flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Envoyer</span>
        </button>
      </form>
    </div>
  );
};
