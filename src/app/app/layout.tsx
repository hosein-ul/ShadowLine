import '../globals.css';
import ClientLayout from '../ClientLayout';

/**
 * App layout. Owns the application's design system + provider chain.
 *
 *   - imports globals.css so it is bundled ONLY for /app/* routes
 *   - wraps everything in ClientLayout (Wagmi, ZamaSDK, theme/network ctx,
 *     toast provider, Header, Footer)
 *
 * The landing page at / has no globals.css and no ClientLayout, which keeps
 * the two design systems hermetically separated.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
