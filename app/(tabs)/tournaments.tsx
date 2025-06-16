import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Trophy, 
  Calendar, 
  Users, 
  MapPin, 
  Plus,
  Clock,
  Award,
  Target
} from 'lucide-react-native';

const activeTournaments = [
  {
    id: 1,
    name: 'City Cricket Championship',
    type: 'T20',
    teams: 8,
    matches: 24,
    startDate: 'Dec 15, 2024',
    venue: 'Sports Complex',
    prize: '$5,000',
    status: 'Ongoing',
    image: 'https://images.pexels.com/photos/1372105/pexels-photo-1372105.jpeg?auto=compress&cs=tinysrgb&w=300&h=200'
  },
  {
    id: 2,
    name: 'Corporate Cricket Cup',
    type: 'ODI',
    teams: 12,
    matches: 36,
    startDate: 'Jan 10, 2025',
    venue: 'Central Ground',
    prize: '$10,000',
    status: 'Registration Open',
    image: 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=300&h=200'
  }
];

const upcomingTournaments = [
  {
    id: 3,
    name: 'Weekend Warriors League',
    type: 'T20',
    teams: 6,
    registrationDeadline: 'Dec 30, 2024',
    startDate: 'Jan 15, 2025',
    entryFee: '$50 per team'
  },
  {
    id: 4,
    name: 'Inter-School Championship',
    type: 'ODI',
    teams: 16,
    registrationDeadline: 'Jan 5, 2025',
    startDate: 'Jan 20, 2025',
    entryFee: 'Free'
  }
];

export default function TournamentsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tournaments</Text>
        <TouchableOpacity style={styles.createButton}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Tournaments</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {activeTournaments.map((tournament) => (
            <TouchableOpacity key={tournament.id} style={styles.tournamentCard}>
              <Image source={{ uri: tournament.image }} style={styles.tournamentImage} />
              <View style={styles.tournamentContent}>
                <View style={styles.tournamentHeader}>
                  <Text style={styles.tournamentName}>{tournament.name}</Text>
                  <View style={[styles.statusBadge, 
                    tournament.status === 'Ongoing' ? styles.ongoingBadge : styles.openBadge
                  ]}>
                    <Text style={[styles.statusText,
                      tournament.status === 'Ongoing' ? styles.ongoingText : styles.openText
                    ]}>
                      {tournament.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.tournamentInfo}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Target size={16} color="#666666" />
                      <Text style={styles.infoText}>{tournament.type}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Users size={16} color="#666666" />
                      <Text style={styles.infoText}>{tournament.teams} Teams</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Calendar size={16} color="#666666" />
                      <Text style={styles.infoText}>{tournament.startDate}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <MapPin size={16} color="#666666" />
                      <Text style={styles.infoText}>{tournament.venue}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.tournamentFooter}>
                  <View style={styles.prizeContainer}>
                    <Award size={16} color="#FF5722" />
                    <Text style={styles.prizeText}>Prize: {tournament.prize}</Text>
                  </View>
                  <TouchableOpacity style={styles.joinButton}>
                    <Text style={styles.joinButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Tournaments</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {upcomingTournaments.map((tournament) => (
            <TouchableOpacity key={tournament.id} style={styles.upcomingCard}>
              <View style={styles.upcomingContent}>
                <View style={styles.upcomingHeader}>
                  <Text style={styles.upcomingName}>{tournament.name}</Text>
                  <Text style={styles.upcomingType}>{tournament.type}</Text>
                </View>

                <View style={styles.upcomingDetails}>
                  <View style={styles.detailRow}>
                    <Users size={14} color="#666666" />
                    <Text style={styles.detailText}>{tournament.teams} Teams</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={14} color="#666666" />
                    <Text style={styles.detailText}>Registration: {tournament.registrationDeadline}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Calendar size={14} color="#666666" />
                    <Text style={styles.detailText}>Starts: {tournament.startDate}</Text>
                  </View>
                </View>

                <View style={styles.upcomingFooter}>
                  <Text style={styles.entryFee}>Entry: {tournament.entryFee}</Text>
                  <TouchableOpacity style={styles.registerButton}>
                    <Text style={styles.registerButtonText}>Register</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tournament Options</Text>
          <View style={styles.optionsGrid}>
            <TouchableOpacity style={styles.optionCard}>
              <Trophy size={24} color="#1B5E20" />
              <Text style={styles.optionTitle}>Create Tournament</Text>
              <Text style={styles.optionDescription}>Organize your own cricket tournament</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionCard}>
              <Users size={24} color="#1B5E20" />
              <Text style={styles.optionTitle}>Find Teams</Text>
              <Text style={styles.optionDescription}>Connect with teams looking for tournaments</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionCard}>
              <Calendar size={24} color="#1B5E20" />
              <Text style={styles.optionTitle}>Schedule Matches</Text>
              <Text style={styles.optionDescription}>Plan and schedule tournament matches</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionCard}>
              <Award size={24} color="#1B5E20" />
              <Text style={styles.optionTitle}>Leaderboards</Text>
              <Text style={styles.optionDescription}>Track tournament standings</Text>
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B5E20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
  tournamentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  tournamentImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  tournamentContent: {
    padding: 16,
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tournamentName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ongoingBadge: {
    backgroundColor: '#E8F5E8',
  },
  openBadge: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  ongoingText: {
    color: '#1B5E20',
  },
  openText: {
    color: '#FF5722',
  },
  tournamentInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  tournamentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  prizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prizeText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FF5722',
  },
  joinButton: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  upcomingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  upcomingContent: {
    padding: 16,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  upcomingName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    flex: 1,
  },
  upcomingType: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#1B5E20',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upcomingDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  upcomingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  entryFee: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
  },
  registerButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  optionCard: {
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
  optionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 11,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
});