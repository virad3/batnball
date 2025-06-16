import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  TrendingUp, 
  Award, 
  Star, 
  Target,
  Users,
  Trophy,
  Medal,
  Crown
} from 'lucide-react-native';

const topPlayers = [
  {
    id: 1,
    name: 'Virat Kohli',
    team: 'India',
    position: 1,
    points: 2847,
    matches: 45,
    average: 58.2,
    category: 'Batsman',
    image: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'
  },
  {
    id: 2,
    name: 'Pat Cummins',
    team: 'Australia',
    position: 2,
    points: 2756,
    matches: 38,
    average: 24.1,
    category: 'Bowler',
    image: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'
  },
  {
    id: 3,
    name: 'Jos Buttler',
    team: 'England',
    position: 3,
    points: 2645,
    matches: 42,
    average: 45.8,
    category: 'Wicket Keeper',
    image: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'
  },
  {
    id: 4,
    name: 'Rashid Khan',
    team: 'Afghanistan',
    position: 4,
    points: 2534,
    matches: 39,
    average: 18.7,
    category: 'Bowler',
    image: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'
  },
  {
    id: 5,
    name: 'Kane Williamson',
    team: 'New Zealand',
    position: 5,
    points: 2423,
    matches: 41,
    average: 52.3,
    category: 'Batsman',
    image: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'
  }
];

const topTeams = [
  {
    id: 1,
    name: 'Mumbai Warriors',
    wins: 24,
    losses: 6,
    points: 48,
    netRunRate: '+1.45',
    position: 1
  },
  {
    id: 2,
    name: 'Delhi Challengers',
    wins: 22,
    losses: 8,
    points: 44,
    netRunRate: '+0.89',
    position: 2
  },
  {
    id: 3,
    name: 'Chennai Kings',
    wins: 20,
    losses: 10,
    points: 40,
    netRunRate: '+0.56',
    position: 3
  }
];

const categories = [
  { id: 1, name: 'All Players', active: true },
  { id: 2, name: 'Batsmen', active: false },
  { id: 3, name: 'Bowlers', active: false },
  { id: 4, name: 'All-Rounders', active: false },
  { id: 5, name: 'Wicket Keepers', active: false }
];

export default function LeaderboardsScreen() {
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown size={20} color="#FFD700" />;
      case 2:
        return <Medal size={20} color="#C0C0C0" />;
      case 3:
        return <Trophy size={20} color="#CD7F32" />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboards</Text>
        <TouchableOpacity style={styles.filterButton}>
          <TrendingUp size={16} color="#1B5E20" />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity 
                key={category.id} 
                style={[styles.categoryButton, category.active && styles.activeCategoryButton]}
              >
                <Text style={[styles.categoryText, category.active && styles.activeCategoryText]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Players</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.podiumContainer}>
            {topPlayers.slice(0, 3).map((player, index) => (
              <View key={player.id} style={[styles.podiumCard, index === 0 && styles.winnerCard]}>
                <View style={styles.positionBadge}>
                  {getPositionIcon(player.position)}
                  <Text style={styles.positionText}>{player.position}</Text>
                </View>
                <Image source={{ uri: player.image }} style={styles.playerImage} />
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerTeam}>{player.team}</Text>
                <View style={styles.playerStats}>
                  <Text style={styles.pointsText}>{player.points} pts</Text>
                  <Text style={styles.averageText}>Avg: {player.average}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.playersListContainer}>
            {topPlayers.slice(3).map((player) => (
              <TouchableOpacity key={player.id} style={styles.playerCard}>
                <View style={styles.playerRank}>
                  <Text style={styles.rankNumber}>{player.position}</Text>
                </View>
                
                <Image source={{ uri: player.image }} style={styles.playerAvatar} />
                
                <View style={styles.playerInfo}>
                  <Text style={styles.playerCardName}>{player.name}</Text>
                  <View style={styles.playerDetails}>
                    <Text style={styles.teamText}>{player.team}</Text>
                    <Text style={styles.categoryBadge}>{player.category}</Text>
                  </View>
                </View>
                
                <View style={styles.playerMetrics}>
                  <Text style={styles.pointsValue}>{player.points}</Text>
                  <Text style={styles.pointsLabel}>Points</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Teams</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {topTeams.map((team) => (
            <TouchableOpacity key={team.id} style={styles.teamCard}>
              <View style={styles.teamRank}>
                <Text style={styles.teamRankNumber}>{team.position}</Text>
              </View>
              
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{team.name}</Text>
                <View style={styles.teamStats}>
                  <Text style={styles.teamRecord}>W: {team.wins} L: {team.losses}</Text>
                  <Text style={styles.netRunRate}>NRR: {team.netRunRate}</Text>
                </View>
              </View>
              
              <View style={styles.teamPoints}>
                <Text style={styles.teamPointsValue}>{team.points}</Text>
                <Text style={styles.teamPointsLabel}>Points</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Target size={24} color="#1B5E20" />
              <Text style={styles.statValue}>1,247</Text>
              <Text style={styles.statLabel}>Total Matches</Text>
            </View>
            
            <View style={styles.statCard}>
              <Users size={24} color="#1B5E20" />
              <Text style={styles.statValue}>8,542</Text>
              <Text style={styles.statLabel}>Active Players</Text>
            </View>
            
            <View style={styles.statCard}>
              <Trophy size={24} color="#1B5E20" />
              <Text style={styles.statValue}>156</Text>
              <Text style={styles.statLabel}>Tournaments</Text>
            </View>
            
            <View style={styles.statCard}>
              <Award size={24} color="#1B5E20" />
              <Text style={styles.statValue}>342</Text>
              <Text style={styles.statLabel}>Champions</Text>
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  filterButtonText: {
    color: '#1B5E20',
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  content: {
    flex: 1,
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
  categoriesContainer: {
    gap: 8,
    paddingHorizontal: 4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeCategoryButton: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#666666',
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
    gap: 8,
  },
  podiumCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  winnerCard: {
    elevation: 4,
    shadowOpacity: 0.15,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  positionText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#333333',
  },
  playerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    textAlign: 'center',
  },
  playerTeam: {
    fontSize: 10,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginBottom: 4,
  },
  playerStats: {
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#1B5E20',
  },
  averageText: {
    fontSize: 10,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  playersListContainer: {
    gap: 8,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 12,
  },
  playerRank: {
    width: 32,
    height: 32,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#333333',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  playerInfo: {
    flex: 1,
  },
  playerCardName: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    marginBottom: 2,
  },
  playerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  categoryBadge: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: '#1B5E20',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  playerMetrics: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#1B5E20',
  },
  pointsLabel: {
    fontSize: 10,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 12,
  },
  teamRank: {
    width: 32,
    height: 32,
    backgroundColor: '#1B5E20',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamRankNumber: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    marginBottom: 4,
  },
  teamStats: {
    flexDirection: 'row',
    gap: 12,
  },
  teamRecord: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  netRunRate: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  teamPoints: {
    alignItems: 'flex-end',
  },
  teamPointsValue: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#1B5E20',
  },
  teamPointsLabel: {
    fontSize: 10,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
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
    fontSize: 20,
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