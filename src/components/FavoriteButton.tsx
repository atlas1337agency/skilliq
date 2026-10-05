import React, { useState } from 'react';
import { Heart, BookmarkCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore, FavoriteItemType } from '../store/useStore';
import { cn } from '../lib/utils';

interface FavoriteButtonProps {
  itemId: string;
  itemType: FavoriteItemType;
  variant?: 'icon' | 'pill' | 'full';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FavoriteButton({
  itemId,
  itemType,
  variant = 'icon',
  className = '',
  size = 'md'
}: FavoriteButtonProps) {
  const { i18n } = useTranslation();
  const { favorites, toggleFavorite, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';
  const [justToggled, setJustToggled] = useState(false);

  const favKey = `${itemType}_${itemId}`;
  const isSaved = Boolean(favorites?.[favKey]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(itemId, itemType);
    setJustToggled(true);
    setTimeout(() => setJustToggled(false), 600);
  };

  const labelAdd = isRtl ? 'حفظ في المفضلة' : 'Save to Favorites';
  const labelRemove = isRtl ? 'محفوظ في ملفك' : 'Saved in Profile';

  if (variant === 'pill' || variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={isSaved ? labelRemove : labelAdd}
        aria-label={isSaved ? labelRemove : labelAdd}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all duration-200 cursor-pointer select-none border active:scale-95",
          size === 'sm' ? "px-2.5 py-1.5 text-xs" : size === 'lg' ? "px-4 py-3 text-sm" : "px-3.5 py-2 text-xs",
          variant === 'full' && "w-full",
          isSaved
            ? "bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-2xs"
            : "bg-card hover:bg-muted text-foreground border-border/80 shadow-2xs",
          justToggled && "scale-105",
          className
        )}
      >
        <Heart
          className={cn(
            "shrink-0 transition-transform duration-200",
            size === 'sm' ? "w-3.5 h-3.5" : "w-4 h-4",
            isSaved ? "fill-rose-500 text-rose-500 scale-110" : "text-muted-foreground"
          )}
        />
        <span>{isSaved ? labelRemove : labelAdd}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={isSaved ? labelRemove : labelAdd}
      aria-label={isSaved ? labelRemove : labelAdd}
      className={cn(
        "rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer select-none backdrop-blur-md border shadow-md active:scale-90",
        size === 'sm' ? "w-8 h-8" : size === 'lg' ? "w-11 h-11" : "w-9 h-9",
        isSaved
          ? "bg-rose-500 text-white border-rose-400 shadow-rose-500/30"
          : "bg-black/65 hover:bg-black/85 text-white border-white/20 hover:border-white/40",
        justToggled && "scale-120",
        className
      )}
    >
      <Heart
        className={cn(
          "transition-transform duration-200",
          size === 'sm' ? "w-4 h-4" : size === 'lg' ? "w-5 h-5" : "w-4 h-4",
          isSaved ? "fill-white text-white scale-110" : "text-white"
        )}
      />
    </button>
  );
}
