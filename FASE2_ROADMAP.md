# Fase 2 Roadmap — Native App (Capacitor)

## Huidige status: PWA ✅
De app is installeerbaar als PWA via Safari (iPhone) of Chrome (Android).

## Fase 2 doel: Echte native iOS/Android app

### Wat je nodig hebt
- Apple Developer account ($99/jaar) voor iOS
- Google Play Developer account ($25 eenmalig) voor Android
- Mac voor iOS builds (Xcode vereist)

### Stap-voor-stap

#### 1. Capacitor installeren
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npm install @capacitor/push-notifications @capacitor/geolocation @capacitor/camera
npx cap init
```

#### 2. Platforms toevoegen
```bash
npx cap add ios     # Mac vereist
npx cap add android # Windows OK
```

#### 3. Build & sync
```bash
npm run build
npx cap sync
```

#### 4. iOS starten (Mac)
```bash
npx cap open ios  # Opent Xcode
# In Xcode: selecteer je device, klik Play
```

#### 5. Android starten
```bash
npx cap open android  # Opent Android Studio
# In Android Studio: Run > Run 'app'
```

### Push notificaties vervangen

Vervang Firebase (web push) door native Capacitor push:
```typescript
// src/lib/push.ts updaten:
import { PushNotifications } from '@capacitor/push-notifications';

export async function requestNativePush() {
  const result = await PushNotifications.requestPermissions();
  if (result.receive === 'granted') {
    await PushNotifications.register();
  }
}
```

### APNs setup (iOS)
1. Apple Developer → Certificates → Apple Push Notification service SSL
2. Download .p12 certificaat
3. Upload in Firebase Project Settings → iOS app → APNs

### Geolocation vervangen
```typescript
// Vervang browser navigator.geolocation door:
import { Geolocation } from '@capacitor/geolocation';
const pos = await Geolocation.getCurrentPosition();
```

### Camera voor bon scanner
```typescript
// Vervang file input door:
import { Camera, CameraResultType } from '@capacitor/camera';
const foto = await Camera.getPhoto({
  quality: 90,
  resultType: CameraResultType.Base64,
});
```

### App Store submission
1. Versie ophogen in package.json
2. `npx cap sync`
3. Xcode: Product > Archive
4. App Store Connect: upload via Xcode Organizer
5. Wacht op review (~24-48 uur)

### Play Store submission
1. Android Studio: Build > Generate Signed Bundle
2. Maak keystore aan (bewaar dit goed!)
3. Upload .aab bestand in Play Console
4. Wacht op review (~1-3 dagen)
