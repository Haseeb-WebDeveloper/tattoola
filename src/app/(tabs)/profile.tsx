import { Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../providers/AuthProvider';

export default function ProfileScreen() {
  const { signOut, user, loading } = useAuth();

  return (
    <View className="flex-1 items-center justify-center bg-primary gap-4">
      <Text className="text-xl font-bold text-primary-foreground">Profile</Text>
      {user && (
        <Text className="text-primary-foreground">{user.email}</Text>
      )}
      <Button
        title={loading ? 'Signing out...' : 'Logout'}
        onPress={signOut}
        disabled={loading}
        variant="secondary"
      />
    </View>
  );
}
