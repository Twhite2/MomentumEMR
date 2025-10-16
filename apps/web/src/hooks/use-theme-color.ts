import { useHospitalTheme } from '@/contexts/hospital-theme-context';

export function useThemeColor() {
  const { theme } = useHospitalTheme();
  
  return {
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    primaryStyle: { color: theme.primaryColor },
    primaryBgStyle: { backgroundColor: theme.primaryColor },
    secondaryStyle: { color: theme.secondaryColor },
    secondaryBgStyle: { backgroundColor: theme.secondaryColor },
  };
}
