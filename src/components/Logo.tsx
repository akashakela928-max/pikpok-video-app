interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-24 w-24',
  xl: 'h-44 w-44',
};

const LOGO_SRC = '/WhatsApp_Image_2026-10-16_at_9.16.39_PM.jpeg';

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="PikPok"
      className={`object-contain ${SIZES[size]} ${className}`}
    />
  );
}
