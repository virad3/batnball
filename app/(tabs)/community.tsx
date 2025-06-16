import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Users, 
  Search, 
  MapPin, 
  Calendar,
  MessageCircle,
  Heart,
  Share,
  Plus,
  UserPlus,
  Trophy,
  Target
} from 'lucide-react-native';

const communityPosts = [
  {
    id: 1,
    user: {
      name: 'Rajesh Kumar',
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
      role: 'Captain',
      team: 'Delhi Warriors'
    },
    content: 'Amazing match today! Our team scored 180 runs in 18 overs. Looking for more players to join our weekend league.',
    image: 'https://images.pexels.com/photos/1372105/pexels-photo-1372105.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
    time: '2 hours ago',
    likes: 24,
    comments: 8,
    location: 'Sports Complex, Delhi'
  },
  {
    id: 2,
    user: {
      name: 'Priya Sharma',
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
      role: 'All-rounder',
      team: 'Mumbai Challengers'
    },
    content: 'Just completed my first century! 104* off 87 balls. Dreams do come true when you work hard! 🏏',
    time: '4 hours ago',
    likes: 156,
    comments: 23,
    location: 'Oval Maidan, Mumbai'
  },
  {
    id: 3,
    user: {
      name: 'Arjun Patel',
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
      role: 'Bowler',
      team: 'Bangalore Kings'
    },
    content: 'Looking for a wicket keeper for our upcoming tournament. Contact me if interested!',
    time: '1 day ago',
    likes: 12,
    comments: 5,
    location: 'Chinnaswamy Stadium'
  }
];

const nearbyPlayers = [
  {
    id: 1,
    name: 'Vikram Singh',
    role: 'Batsman',
    experience: '5 years',
    distance: '2.1 km',
    rating: 4.8,
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'
  },
  {
    id: 2,
    name: 'Rohit Mehta',
    role: 'All-rounder',
    experience: '3 years',
    distance: '3.5 km',
    rating: 4.6,
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'
  },
  {
    id: 3,
    name: 'Amit Gupta',
    role: 'Bowler',
    experience: '7 years',
    distance: '1.8 km',
    rating: 4.9,
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'
  }
];

const tournaments = [
  {
    id: 1,
    name: 'Weekend Cricket Cup',
    date: 'Dec 28-30, 2024',
    teamsNeeded: 4,
    location: 'Central Ground'
  },
  {
    id: 2,
    name: 'New Year Championship',
    date: 'Jan 5-7, 2025',
    teamsNeeded: 2,
    location: 'Sports Complex'
  }
];

export default function CommunityScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cricket Community</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Search size={20} color="#1B5E20" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={16} color="#666666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search players, teams, tournaments..."
              placeholderTextColor="#999999"
            />
          </View>
        </View>

        <View style={styles.quickActions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <UserPlus size={20} color="#1B5E20" />
              <Text style={styles.actionText}>Find Players</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Users size={20} color="#1B5E20" />
              <Text style={styles.actionText}>Find Teams</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Target size={20} color="#1B5E20" />
              <Text style={styles.actionText}>Find Umpires</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Trophy size={20} color="#1B5E20" />
              <Text style={styles.actionText}>Tournaments</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Community Feed</Text>
            <TouchableOpacity style={styles.postButton}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          </View>

          {communityPosts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Image source={{ uri: post.user.avatar }} style={styles.userAvatar} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{post.user.name}</Text>
                  <View style={styles.userDetails}>
                    <Text style={styles.userRole}>{post.user.role}</Text>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.userTeam}>{post.user.team}</Text>
                  </View>
                  <Text style={styles.postTime}>{post.time}</Text>
                </View>
              </View>

              <Text style={styles.postContent}>{post.content}</Text>

              {post.image && (
                <Image source={{ uri: post.image }} style={styles.postImage} />
              )}

              {post.location && (
                <View style={styles.locationContainer}>
                  <MapPin size={12} color="#666666" />
                  <Text style={styles.locationText}>{post.location}</Text>
                </View>
              )}

              <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionItem}>
                  <Heart size={16} color="#666666" />
                  <Text style={styles.actionCount}>{post.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem}>
                  <MessageCircle size={16} color="#666666" />
                  <Text style={styles.actionCount}>{post.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem}>
                  <Share size={16} color="#666666" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Players</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playersContainer}>
            {nearbyPlayers.map((player) => (
              <TouchableOpacity key={player.id} style={styles.playerCard}>
                <Image source={{ uri: player.avatar }} style={styles.playerAvatar} />
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerRole}>{player.role}</Text>
                <Text style={styles.playerExperience}>{player.experience} exp</Text>
                <View style={styles.playerFooter}>
                  <Text style={styles.playerDistance}>{player.distance} away</Text>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>★ {player.rating}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.connectButton}>
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Looking for Players</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {tournaments.map((tournament) => (
            <TouchableOpacity key={tournament.id} style={styles.tournamentCard}>
              <View style={styles.tournamentInfo}>
                <Text style={styles.tournamentName}>{tournament.name}</Text>
                <View style={styles.tournamentDetails}>
                  <View style={styles.detailItem}>
                    <Calendar size={12} color="#666666" />
                    <Text style={styles.detailText}>{tournament.date}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MapPin size={12} color="#666666" />
                    <Text style={styles.detailText}>{tournament.location}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.tournamentAction}>
                <Text style={styles.teamsNeeded}>{tournament.teamsNeeded} teams needed</Text>
                <TouchableOpacity style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Users size={24} color="#1B5E20" />
              <Text style={styles.statValue}>2,847</Text>
              <Text style={styles.statLabel}>Active Players</Text>
            </View>
            
            <View style={styles.statCard}>
              <Trophy size={24} color="#1B5E20" />
              <Text style={styles.statValue}>156</Text>
              <Text style={styles.statLabel}>Teams</Text>
            </View>
            
            <View style={styles.statCard}>
              <Target size={24} color="#1B5E20" />
              <Text style={styles.statValue}>89</Text>
              <Text style={styles.statLabel}>Matches Today</Text>
            </View>
            
            <View style={styles.statCard}>
              <MessageCircle size={24} color="#1B5E20" />
              <Text style={styles.statValue}>1,234</Text>
              <Text style={styles.statLabel}>Active Chats</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#1B5E20',
  },
  searchButton: {
    padding: 8,
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
  },
  quickActions: {
    paddingVertical: 8,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#333333',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#1B5E20',
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B5E20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    marginBottom: 2,
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#1B5E20',
  },
  separator: {
    fontSize: 10,
    color: '#666666',
  },
  userTeam: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  postTime: {
    fontSize: 11,
    fontFamily: 'Roboto-Regular',
    color: '#999999',
  },
  postContent: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  playersContainer: {
    gap: 12,
    paddingHorizontal: 4,
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: 140,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 2,
  },
  playerRole: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#1B5E20',
    marginBottom: 2,
  },
  playerExperience: {
    fontSize: 10,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginBottom: 8,
  },
  playerFooter: {
    alignItems: 'center',
    marginBottom: 8,
  },
  playerDistance: {
    fontSize: 10,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginBottom: 2,
  },
  ratingContainer: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    color: '#FF5722',
  },
  connectButton: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
  },
  tournamentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tournamentInfo: {
    marginBottom: 12,
  },
  tournamentName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    marginBottom: 8,
  },
  tournamentDetails: {
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  tournamentAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  teamsNeeded: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#FF5722',
  },
  joinButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#1B5E20',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    textAlign: 'center',
  },
});