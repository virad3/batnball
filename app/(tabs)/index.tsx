import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Play, 
  Calendar, 
  MapPin, 
  Users, 
  Activity,
  Clock,
  Target
} from 'lucide-react-native';

const liveMatches = [
  {
    id: 1,
    team1: { name: 'Australia', logo: 'https://images.pexels.com/photos/163452/basketball-dunk-blue-game-163452.jpeg?auto=compress&cs=tinysrgb&w=100&h=100', score: '287/6', overs: '45.2' },
    team2: { name: 'India', logo: 'https://images.pexels.com/photos/163452/basketball-dunk-blue-game-163452.jpeg?auto=compress&cs=tinysrgb&w=100&h=100', score: '156/3', overs: '32.4' },
    status: 'LIVE',
    venue: 'MCG, Melbourne',
    format: 'ODI'
  },
  {
    id: 2,
    team1: { name: 'England', logo: 'https://images.pexels.com/photos/163452/basketball-dunk-blue-game-163452.jpeg?auto=compress&cs=tinysrgb&w=100&h=100', score: '145/4', overs: '18.3' },
    team2: { name: 'Pakistan', logo: 'https://images.pexels.com/photos/163452/basketball-dunk-blue-game-163452.jpeg?auto=compress&cs=tinysrgb&w=100&h=100', score: '89/2', overs: '12.1' },
    status: 'LIVE',
    venue: 'Lord\'s, London',
    format: 'T20'
  }
];

const upcomingMatches = [
  {
    id: 3,
    team1: 'New Zealand',
    team2: 'South Africa',
    date: 'Tomorrow',
    time: '2:30 PM',
    venue: 'Eden Park, Auckland',
    format: 'Test'
  },
  {
    id: 4,
    team1: 'Sri Lanka',
    team2: 'Bangladesh',
    date: 'Dec 28',
    time: '10:00 AM',
    venue: 'Galle International',
    format: 'ODI'
  }
];

export default function LiveScoreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cricket Live</Text>
        <TouchableOpacity style={styles.liveButton}>
          <Activity size={16} color="#FFFFFF" />
          <Text style={styles.liveButtonText}>LIVE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Matches</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {liveMatches.map((match) => (
            <TouchableOpacity key={match.id} style={styles.liveMatchCard}>
              <View style={styles.matchHeader}>
                <Text style={styles.matchFormat}>{match.format}</Text>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>{match.status}</Text>
                </View>
              </View>

              <View style={styles.teamsContainer}>
                <View style={styles.teamRow}>
                  <View style={styles.teamInfo}>
                    <Image source={{ uri: match.team1.logo }} style={styles.teamLogo} />
                    <Text style={styles.teamName}>{match.team1.name}</Text>
                  </View>
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreText}>{match.team1.score}</Text>
                    <Text style={styles.oversText}>({match.team1.overs})</Text>
                  </View>
                </View>

                <View style={styles.teamRow}>
                  <View style={styles.teamInfo}>
                    <Image source={{ uri: match.team2.logo }} style={styles.teamLogo} />
                    <Text style={styles.teamName}>{match.team2.name}</Text>
                  </View>
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreText}>{match.team2.score}</Text>
                    <Text style={styles.oversText}>({match.team2.overs})</Text>
                  </View>
                </View>
              </View>

              <View style={styles.matchFooter}>
                <View style={styles.venueInfo}>
                  <MapPin size={14} color="#666666" />
                  <Text style={styles.venueText}>{match.venue}</Text>
                </View>
                <TouchableOpacity style={styles.watchButton}>
                  <Play size={14} color="#1B5E20" />
                  <Text style={styles.watchButtonText}>Watch</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Matches</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {upcomingMatches.map((match) => (
            <TouchableOpacity key={match.id} style={styles.upcomingMatchCard}>
              <View style={styles.matchHeader}>
                <Text style={styles.matchFormat}>{match.format}</Text>
                <View style={styles.timeInfo}>
                  <Clock size={14} color="#666666" />
                  <Text style={styles.timeText}>{match.date}</Text>
                </View>
              </View>

              <View style={styles.upcomingTeams}>
                <Text style={styles.teamNameLarge}>{match.team1}</Text>
                <Text style={styles.vsText}>vs</Text>
                <Text style={styles.teamNameLarge}>{match.team2}</Text>
              </View>

              <View style={styles.matchDetails}>
                <View style={styles.venueInfo}>
                  <MapPin size={14} color="#666666" />
                  <Text style={styles.venueText}>{match.venue}</Text>
                </View>
                <Text style={styles.matchTime}>{match.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Target size={24} color="#1B5E20" />
              <Text style={styles.actionText}>Start Scoring</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Users size={24} color="#1B5E20" />
              <Text style={styles.actionText}>Find Players</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Calendar size={24} color="#1B5E20" />
              <Text style={styles.actionText}>Schedule Match</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Activity size={24} color="#1B5E20" />
              <Text style={styles.actionText}>Live Stream</Text>
            </TouchableOpacity>
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
  liveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  liveButtonText: {
    color: '#FFFFFF',
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
  liveMatchCard: {
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
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchFormat: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#666666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    backgroundColor: '#FF5722',
    borderRadius: 4,
  },
  liveText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#FF5722',
  },
  teamsContainer: {
    gap: 12,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  teamName: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#333333',
  },
  scoreInfo: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#1B5E20',
  },
  oversText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  venueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  watchButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#1B5E20',
  },
  upcomingMatchCard: {
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
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  upcomingTeams: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginVertical: 12,
  },
  teamNameLarge: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  vsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#666666',
  },
  matchDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  matchTime: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#1B5E20',
  },
  quickActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  actionCard: {
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
  actionText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#333333',
    textAlign: 'center',
  },
});