import { AppLogo } from "@/components/common/AppLogo";
import { APP_NAME, APP_HEADER_INFO } from "@/lib/constants";

export function AppHeader() {
  return (
    <header className="mb-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <AppLogo size={40} className="text-white" />
          <h1 className="text-2xl md:text-3xl font-bold ml-2 text-white">{APP_NAME}</h1>
        </div>
        <div className="text-sm text-gray-300">{APP_HEADER_INFO}</div>
      </div>
    </header>
  );
}
