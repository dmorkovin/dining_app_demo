import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronUp, Send, Heart, X, TrendingUp, Flame, Wheat, Smile, User } from 'lucide-react';
import { supabase, DEMO_SEED_USER_ID } from '../lib/supabase';
import { formatAllergenDisplay, SUPPRESSED_TAGS } from '../lib/allergens';
import type { Database } from '../lib/database.types';
import { haptic } from '../utils/haptics';

type Poll = Database['public']['Tables']['polls']['Row'];
type PollOption = Database['public']['Tables']['poll_options']['Row'];
type ThemeProposal = Database['public']['Tables']['theme_proposals']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type Staff = Database['public']['Tables']['staff']['Row'];

type ActiveTab = 'swipe' | 'polls' | 'kudos' | 'themes';

type PollWithData = {
  poll: Poll;
  options: PollOption[];
  userVote: string | null;
};

interface VoteTabProps {
  userId: string;
  onSendSmile?: (staff: Staff) => void;
}

export function VoteTab({ userId, onSendSmile }: VoteTabProps) {
  const { t } = useTranslation('discover');
  const [activeTab, setActiveTab] = useState<ActiveTab>('swipe');

  const TABS: { id: ActiveTab; label: string }[] = [
    { id: 'swipe', label: t('tabs.swipe') },
    { id: 'polls', label: t('tabs.polls') },
    { id: 'kudos', label: t('tabs.kudos') },
    { id: 'themes', label: t('tabs.themes') },
  ];

  const [polls, setPolls] = useState<PollWithData[]>([]);
  const [themeProposals, setThemeProposals] = useState<ThemeProposal[]>([]);
  const [newTheme, setNewTheme] = useState('');
  const [upvotedThemes, setUpvotedThemes] = useState<Set<string>>(new Set());

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [swipeAxis, setSwipeAxis] = useState<'horizontal' | 'vertical' | null>(null);
  const [likedItems, setLikedItems] = useState<MenuItem[]>([]);
  const [passedCount, setPassedCount] = useState(0);
  const [sentSmiles, setSentSmiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMenuItems();
    fetchStaff();
    fetchSentSmiles();
    fetchPoll();
    fetchThemeProposals();
    fetchUserUpvotes();
  }, []);

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('smile_count', { ascending: false });
    if (error) console.error('Error fetching staff:', error);
    if (data) setStaff(data);
  };

  const fetchSentSmiles = async () => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from('smiles_sent')
      .select('staff_id')
      .eq('user_id', userId)
      .gte('created_at', startOfWeek.toISOString());
    if (data) setSentSmiles(new Set(data.map((s) => s.staff_id)));
  };

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching menu items:', error);
    if (data) setMenuItems(data);
  };

  const fetchPoll = async () => {
    const { data: pollsData } = await supabase
      .from('polls')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (!pollsData) return;

    const results: PollWithData[] = await Promise.all(
      pollsData.map(async (poll) => {
        const { data: optionsData } = await supabase
          .from('poll_options')
          .select('*')
          .eq('poll_id', poll.id);

        const { data: voteData } = await supabase
          .from('user_votes')
          .select('option_id')
          .eq('user_id', userId)
          .eq('poll_id', poll.id)
          .maybeSingle();

        return {
          poll,
          options: optionsData ?? [],
          userVote: voteData?.option_id ?? null,
        };
      })
    );

    setPolls(results);
  };

  const fetchThemeProposals = async () => {
    const { data } = await supabase
      .from('theme_proposals')
      .select('*')
      .neq('user_id', DEMO_SEED_USER_ID)
      .order('vote_count', { ascending: false });

    if (data) setThemeProposals(data);
  };

  const fetchUserUpvotes = async () => {
    const { data } = await supabase
      .from('theme_upvotes')
      .select('theme_id')
      .eq('user_id', userId);

    if (data) {
      setUpvotedThemes(new Set(data.map((u) => u.theme_id)));
    }
  };

  const handleSwipe = async (action: 'liked' | 'passed') => {
    haptic.light();
    const currentItem = menuItems[currentIndex];
    if (!currentItem) return;

    await supabase.from('user_swipes').insert({
      user_id: userId,
      menu_item_id: currentItem.id,
      action,
    });

    if (action === 'liked') {
      setLikedItems([...likedItems, currentItem]);
    } else {
      setPassedCount(passedCount + 1);
    }

    setSwipeDirection(action === 'liked' ? 'right' : 'left');
    setTimeout(() => {
      setCurrentIndex(currentIndex + 1);
      setSwipeDirection(null);
      setDragOffset({ x: 0, y: 0 });
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragStart({ x: t.clientX, y: t.clientY });
    setSwipeAxis(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStart) return;
    const t = e.touches[0];
    const deltaX = t.clientX - dragStart.x;
    const deltaY = t.clientY - dragStart.y;

    const axis = swipeAxis ?? (Math.abs(deltaX) > Math.abs(deltaY) * 2 ? 'horizontal' : 'vertical');
    if (!swipeAxis) setSwipeAxis(axis);

    if (axis === 'vertical') return;

    e.preventDefault();
    e.stopPropagation();
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    if (!dragStart) return;
    if (swipeAxis === 'horizontal' && Math.abs(dragOffset.x) > 80) {
      handleSwipe(dragOffset.x > 0 ? 'liked' : 'passed');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
    setDragStart(null);
    setSwipeAxis(null);
  };

  const handleVote = async (pollId: string, optionId: string) => {
    const entry = polls.find((p) => p.poll.id === pollId);
    if (!entry || entry.userVote) return;

    const { error: voteError } = await supabase.from('user_votes').insert({
      user_id: userId,
      poll_id: pollId,
      option_id: optionId,
    });

    if (!voteError) {
      await supabase.rpc('increment_poll_option_vote', { option_id: optionId });
      setPolls((prev) =>
        prev.map((p) => (p.poll.id === pollId ? { ...p, userVote: optionId } : p))
      );
      fetchPoll();
    }
  };

  const handleSubmitTheme = async () => {
    if (!newTheme.trim()) return;

    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .maybeSingle();

    const { error } = await supabase.from('theme_proposals').insert({
      user_id: userId,
      text: newTheme.trim(),
      author_name: userData?.name || 'Anonymous',
    });

    if (!error) {
      setNewTheme('');
      fetchThemeProposals();
    }
  };

  const handleUpvoteTheme = async (themeId: string) => {
    if (upvotedThemes.has(themeId)) return;
    const { error: upvoteError } = await supabase.from('theme_upvotes').insert({
      user_id: userId,
      theme_id: themeId,
    });
    if (!upvoteError) {
      const { error: updateError } = await supabase.rpc('increment_theme_vote', {
        proposal_id: themeId,
      });
      if (!updateError) {
        setThemeProposals((prev) =>
          prev
            .map((tp) =>
              tp.id === themeId ? { ...tp, vote_count: (tp.vote_count ?? 0) + 1 } : tp
            )
            .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
        );
        setUpvotedThemes(new Set([...upvotedThemes, themeId]));
      }
    }
  };

  const currentItem = menuItems[currentIndex];
  const nextItem = menuItems[currentIndex + 1];
  const nextNextItem = menuItems[currentIndex + 2];
  const allSwiped = currentIndex >= menuItems.length && menuItems.length > 0;

  const rotation = dragOffset.x * 0.1;
  const opacity = 1 - Math.abs(dragOffset.x) / 200;

  const getTagIcon = (tag: string) => {
    if (SUPPRESSED_TAGS.includes(tag)) return null;
    if (tag === 'V') return <Wheat className="w-3 h-3" />;
    return null;
  };

  const getTagLabel = (tag: string) => {
    if (SUPPRESSED_TAGS.includes(tag)) return '';
    if (tag === 'V') return 'Vegetarian';
    return tag;
  };

  const panelStyle: React.CSSProperties = {
    overflowY: 'auto',
    height: 'calc(100vh - 50px - env(safe-area-inset-top) - 44px - 49px - env(safe-area-inset-bottom))',
    padding: '16px 20px',
    overscrollBehavior: 'contain',
  };

  return (
    <div
      style={{
        position: 'relative',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        height: '100%',
      }}
    >
      {/* Inner tab bar */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          height: '44px',
          background: '#ffffff',
          borderBottom: '1px solid #e8e2d8',
          display: 'flex',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                height: '100%',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #EE5E29' : '2px solid transparent',
                color: isActive ? '#EE5E29' : '#58595B',
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 600,
                fontSize: '12px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
                padding: '0',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Swipe tab */}
      {activeTab === 'swipe' && (
        <div style={{ ...panelStyle, touchAction: 'pan-y' }}>
          {!allSwiped ? (
            <>
              <div style={{ touchAction: 'pan-y', overflowY: 'visible' }}>
                <div className="relative mb-2 lg:max-w-md lg:mx-auto">
                  {nextNextItem && (
                    <div
                      className="absolute left-0 right-0 top-4 bg-white rounded-[14px] card-shadow pointer-events-none"
                      style={{ transform: 'scale(0.92)', opacity: 0.5 }}
                    />
                  )}
                  {nextItem && (
                    <div
                      className="absolute left-0 right-0 top-2 bg-white rounded-[14px] card-shadow pointer-events-none"
                      style={{ transform: 'scale(0.96)', opacity: 0.7 }}
                    />
                  )}
                  {currentItem && (
                    <div
                      className="relative bg-white rounded-[14px] card-shadow-lg cursor-grab active:cursor-grabbing"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      style={{
                        touchAction: 'none',
                        transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
                        opacity: swipeDirection ? 0 : opacity,
                        transition: swipeDirection || !dragStart ? 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
                        willChange: 'transform',
                      }}
                    >
                      <div>
                        <div className="relative">
                          <img
                            src={currentItem.image_url}
                            alt={currentItem.name}
                            className="w-full h-[200px] object-cover rounded-t-[14px]"
                          />
                          {currentItem.trending && (
                            <div className="absolute top-3 right-3 bg-[var(--color-orange)] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>{t('swipe.trending')}</span>
                            </div>
                          )}
                          {currentItem.tags.length > 0 && (
                            <div className="absolute top-3 left-3 flex gap-2">
                              {currentItem.tags.filter((tag) => !SUPPRESSED_TAGS.includes(tag)).map((tag) => (
                                <div
                                  key={tag}
                                  className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold text-[var(--color-teal)] flex items-center gap-1"
                                  title={getTagLabel(tag)}
                                >
                                  {getTagIcon(tag)}
                                  <span>{tag}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-5">
                        <span className="text-xs font-semibold text-[var(--color-orange)] uppercase tracking-wide">
                          {currentItem.category}
                        </span>
                        <div className="flex items-baseline justify-between mt-1">
                          <h3 className="text-xl font-bold text-[var(--color-navy)]">
                            {currentItem.name}
                          </h3>
                          {currentItem.price != null && (
                            <span className="text-lg font-bold text-[var(--color-orange)] ml-3 flex-shrink-0">
                              ${Number(currentItem.price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {currentItem.description}
                        </p>

                        <div className="grid grid-cols-4 gap-3 mt-4">
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <div className="text-xs text-gray-500">{t('swipe.calories')}</div>
                            <div className="text-lg font-serif font-bold text-[var(--color-navy)] mt-0.5">
                              {currentItem.calories}
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <div className="text-xs text-gray-500">{t('swipe.protein')}</div>
                            <div className="text-lg font-serif font-bold text-[var(--color-navy)] mt-0.5">
                              {currentItem.protein}g
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <div className="text-xs text-gray-500">{t('swipe.carbs')}</div>
                            <div className="text-lg font-serif font-bold text-[var(--color-navy)] mt-0.5">
                              {currentItem.carbs}g
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <div className="text-xs text-gray-500">{t('swipe.fat')}</div>
                            <div className="text-lg font-serif font-bold text-[var(--color-navy)] mt-0.5">
                              {currentItem.fat}g
                            </div>
                          </div>
                        </div>

                        {currentItem.allergens.length > 0 && (
                          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Flame className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-xs font-semibold text-orange-900">{t('swipe.contains')}</div>
                                <div className="text-xs text-orange-700 mt-0.5">
                                  {currentItem.allergens.map(a => formatAllergenDisplay(a)).join(', ')}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center mb-8 lg:max-w-md lg:mx-auto" style={{ gap: '24px', marginTop: '16px' }}>
                <button
                  onClick={() => handleSwipe('passed')}
                  className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95 card-shadow"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
                <button
                  onClick={() => handleSwipe('liked')}
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 card-shadow-lg"
                  style={{ backgroundColor: '#EE5E29' }}
                >
                  <Heart className="w-6 h-6 text-white" fill="currentColor" />
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center mb-8 lg:max-w-md lg:mx-auto">
              <div className="w-20 h-20 bg-[var(--color-teal)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-white" fill="currentColor" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-navy)]">{t('swipe.allDone')}</h3>
              <p className="text-gray-600 mt-2">
                {t('swipe.reviewSummary', { liked: likedItems.length, passed: passedCount })}
              </p>
              {likedItems.length > 0 && (
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {likedItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg overflow-hidden card-shadow">
                      <img src={item.image_url} alt={item.name} className="w-full h-20 object-cover" />
                      <div className="p-2">
                        <div className="text-xs font-semibold text-[var(--color-navy)] truncate">
                          {item.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setLikedItems([]);
                  setPassedCount(0);
                }}
                className="mt-6 px-6 py-3 bg-[var(--color-orange)] text-white rounded-full font-semibold hover:bg-orange-600 transition-colors"
              >
                {t('swipe.swipeAgain')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Polls tab */}
      {activeTab === 'polls' && (
        <div style={{ ...panelStyle, paddingBottom: 'calc(49px + env(safe-area-inset-bottom) + 20px)' }}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--color-navy)]">{t('polls.title')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('polls.subtitle')}</p>
          </div>

          {polls.map((entry) => {
            const totalVotes = entry.options.reduce((sum, opt) => sum + opt.vote_count, 0);

            return (
              <div key={entry.poll.id} className="bg-white rounded-[14px] p-5 card-shadow mb-8">
                <h3 className="font-bold text-lg text-[var(--color-navy)] mb-4">{entry.poll.question}</h3>

                <div className="space-y-3">
                  {entry.options.map((option) => {
                    const percentage = totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0;
                    const isSelected = entry.userVote === option.id;

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleVote(entry.poll.id, option.id)}
                        disabled={!!entry.userVote}
                        className={`w-full text-left rounded-lg overflow-hidden transition-all ${
                          entry.userVote
                            ? 'cursor-default'
                            : 'hover:ring-2 hover:ring-[var(--color-orange)] cursor-pointer'
                        }`}
                      >
                        <div
                          className={`relative p-4 ${
                            isSelected
                              ? 'bg-[var(--color-teal)] text-white'
                              : entry.userVote
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-gray-50 text-[var(--color-navy)]'
                          }`}
                        >
                          {entry.userVote && (
                            <div
                              className={`absolute inset-0 ${
                                isSelected ? 'bg-[var(--color-teal)]' : 'bg-[var(--color-orange)]'
                              } opacity-20 transition-all duration-700`}
                              style={{ width: `${percentage}%` }}
                            />
                          )}
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {!entry.userVote && (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                              )}
                              <span className="font-semibold">{option.text}</span>
                            </div>
                            {entry.userVote && (
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold">{option.vote_count} {t('polls.votes')}</span>
                                <span className="font-bold">{percentage.toFixed(0)}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {entry.userVote && (
                  <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-900">
                    {t('polls.thanksForVoting')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Kudos tab */}
      {activeTab === 'kudos' && (
        <div style={panelStyle}>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-[var(--color-navy)]">{t('kudos.title')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('kudos.subtitle')}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-[14px] p-4 card-shadow flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mb-3">
                    {member.image_url ? (
                      <img
                        src={member.image_url}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <h4 className="font-bold text-[var(--color-navy)] text-sm leading-tight">
                    {member.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{member.role}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-[var(--color-navy)]">
                    <Heart className="w-3.5 h-3.5 text-red-500" fill="currentColor" />
                    <span>{member.smile_count}</span>
                  </div>
                  <button
                    onClick={async () => {
                      if (sentSmiles.has(member.id)) return;
                      onSendSmile?.(member);
                      setSentSmiles(prev => new Set(prev).add(member.id));
                      setTimeout(() => fetchStaff(), 2500);
                    }}
                    disabled={sentSmiles.has(member.id)}
                    className={`mt-3 w-full py-2 px-3 text-xs font-semibold rounded-full transition-all active:scale-95 flex items-center justify-center gap-1 ${
                      sentSmiles.has(member.id)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[var(--color-orange)] hover:bg-orange-600 text-white'
                    }`}
                  >
                    <Smile className="w-3.5 h-3.5" />
                    <span>{sentSmiles.has(member.id) ? t('kudos.smiledThisWeek') : t('kudos.sendSmile')}</span>
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Themes tab */}
      {activeTab === 'themes' && (
        <div style={panelStyle}>
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-[var(--color-navy)] mb-1">{t('themes.title')}</h3>
            <p className="text-sm text-gray-600">{t('themes.subtitle')}</p>
          </div>

          <div className="bg-white rounded-[14px] p-4 lg:p-5 card-shadow mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitTheme()}
                placeholder={t('themes.placeholder')}
                className="flex-1 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-orange)] text-sm"
                style={{ fontSize: '16px' }}
              />
              <button
                onClick={handleSubmitTheme}
                disabled={!newTheme.trim()}
                className="px-4 py-2 bg-[var(--color-orange)] text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {themeProposals.map((theme) => {
              const hasUpvoted = upvotedThemes.has(theme.id);

              return (
                <div key={theme.id} className="bg-white rounded-[14px] p-4 card-shadow">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleUpvoteTheme(theme.id)}
                      disabled={hasUpvoted}
                      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                        hasUpvoted
                          ? 'bg-[var(--color-teal)] text-white cursor-default'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ChevronUp className="w-5 h-5" />
                      <span className="text-xs font-bold">{theme.vote_count}</span>
                    </button>

                    <div className="flex-1">
                      <p className="text-[var(--color-navy)] font-medium leading-relaxed">
                        {theme.text}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {t('themes.proposedBy', { name: theme.author_name })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
