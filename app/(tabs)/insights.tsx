import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, ChartBar as BarChart3, ChartPie as PieChart, Target, Calendar, Award, Users, Activity } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const performanceMetrics = [
  {
    id: 1,
    title: 'Batting Average',
    value: '45.8',
    change: '+12.3%',
    trend: 'up',
    color: '#1B5E20'
  },
  {
    id: 2,
    title: 'Strike Rate',
    value: '128.4',
    change: '+8.7%',
    trend: 'up',
    color: '#FF5722'
  },
  {
    id: 3,
    title: 'Bowling Economy',
    value: '6.2',
    change: '-0.8%',
    trend: 'down',
    color: '#2196F3'
  },
  {
    id: 4,
    title: 'Win Percentage',
    value: '67%',
    change: '+5.2%',
    trend: 'up',
    color: '#4CAF50'
  }
];

const recentMatches = [
  {
    id: 1,
    opponent: 'Chennai Kings',
    result: 'Won',
    runs: '187/6',
    wickets: '3',
    motm: 'Virat Kohli',
    date: 'Dec 20, 2024'
  },
  {
    id: 2,
    opponent: 'Mumbai Warriors',
    result: 'Lost',
    runs: '156/8',
    wickets: '2',
    motm: 'Rohit Sharma',
    date: 'Dec 18, 2024'
  },
  {
    id: 3,
    opponent: 'Delhi Challengers',
    result: 'Won',
    runs: '201/4',
    wickets: '5',
    motm: 'AB de Villiers',
    date: 'Dec 15, 2024'
  }
];

const insights = [
  {
    id: 1,
    type: 'Performance',
    title: 'Best Batting Position',
    description: 'Your highest strike rate comes when batting at position 3',
    value: 'Position 3',
    icon: Target
  },
  {
    id: 2,
    type: 'Strategy',
    title: 'Optimal Bowling Strategy',
    description: 'Spin bowling is most effective against left-handed batsmen',
    value: '78% Success',
    icon: TrendingUp
  },
  {
    id: 3,
    type: 'Opponent',
    title: 'Strongest Matchup',
    description: 'Highest win rate against fast bowling attacks',
    value: '85% Win Rate',
    icon: Award
  }
];

export default function InsightsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CricInsights</Text>
        <TouchableOpacity style={styles.filterButton}>
          <BarChart3 size={16} color="#1B5E20" />
          <Text style={styles.filterButtonText}>Analytics</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.metricsContainer}
          >
            {performanceMetrics.map((metric) => (
              <View key={metric.id} style={styles.metricCard}>
                <Text style={styles.metricTitle}>{metric.title}</Text>
                <Text style={[styles.metricValue, { color: metric.color }]}>
                  {metric.value}
                </Text>
                <View style={styles.changeContainer}>
                  <TrendingUp 
                    size={12} 
                    color={metric.trend === 'up' ? '#4CAF50' : '#F44336'} 
                    style={metric.trend === 'down' && { transform: [{ rotate: '180deg' }] }}
                  />
                  <Text style={[
                    styles.changeText, 
                    { color: metric.trend === 'up' ? '#4CAF50' : '#F44336' }
                  ]}>
                    {metric.change}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Match Analysis</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentMatches.map((match) => (
            <TouchableOpacity key={match.id} style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <Text style={styles.opponentName}>vs {match.opponent}</Text>
                <View style={[
                  styles.resultBadge, 
                  match.result === 'Won' ? styles.wonBadge : styles.lostBadge
                ]}>
                  <Text style={[
                    styles.resultText,
                    match.result === 'Won' ? styles.wonText : styles.lostText
                  ]}>
                    {match.result}
                  </Text>
                </View>
              </View>

              <View style={styles.matchStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Runs</Text>
                  <Text style={styles.statValue}>{match.runs}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Wickets</Text>
                  <Text style={styles.statValue}>{match.wickets}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Man of Match</Text>
                  <Text style={styles.statValue}>{match.motm}</Text>
                </View>
              </View>

              <View style={styles.matchFooter}>
                <View style={styles.dateContainer}>
                  <Calendar size={12} color="#666666" />
                  <Text style={styles.matchDate}>{match.date}</Text>
                </View>
                <TouchableOpacity style={styles.analyzeButton}>
                  <Text style={styles.analyzeButtonText}>Analyze</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
          
          {insights.map((insight) => (
            <TouchableOpacity key={insight.id} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={styles.insightIcon}>
                  <insight.icon size={20} color="#1B5E20" />
                </View>
                <View style={styles.insightContent}>
                  <View style={styles.insightTitleRow}>
                    <Text style={styles.insightType}>{insight.type}</Text>
                    <Text style={styles.insightValue}>{insight.value}</Text>
                  </View>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis Tools</Text>
          <View style={styles.toolsGrid}>
            <TouchableOpacity style={styles.toolCard}>
              <PieChart size={24} color="#1B5E20" />
              <Text style={styles.toolTitle}>Match Comparison</Text>
              <Text style={styles.toolDescription}>Compare performance across matches</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolCard}>
              <BarChart3 size={24} color="#1B5E20" />
              <Text style={styles.toolTitle}>Trend Analysis</Text>
              <Text style={styles.toolDescription}>Track performance trends over time</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolCard}>
              <Users size={24} color="#1B5E20" />
              <Text style={styles.toolTitle}>Player Analysis</Text>
              <Text style={styles.toolDescription}>Detailed player performance stats</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolCard}>
              <Activity size={24} color="#1B5E20" />
              <Text style={styles.toolTitle}>Live Analytics</Text>
              <Text style={styles.toolDescription}>Real-time match insights</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Target size={20} color="#FF5722" />
              <Text style={styles.recommendationTitle}>Training Focus</Text>
            </View>
            <Text style={styles.recommendationText}>
              Based on recent performance, focus on improving strike rate against spin bowling. 
              Practice sessions against left-arm spinners recommended.
            </Text>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>View Training Plan</Text>
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
  metricsContainer: {
    gap: 12,
    paddingHorizontal: 4,
    marginTop: 16,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: width * 0.35,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricTitle: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  matchCard: {
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
    marginBottom: 12,
  },
  opponentName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  wonBadge: {
    backgroundColor: '#E8F5E8',
  },
  lostBadge: {
    backgroundColor: '#FFEBEE',
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  wonText: {
    color: '#1B5E20',
  },
  lostText: {
    color: '#F44336',
  },
  matchStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchDate: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  analyzeButton: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
  },
  insightCard: {
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
  insightHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  insightType: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: '#1B5E20',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  insightValue: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: '#FF5722',
  },
  insightTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    lineHeight: 18,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  toolCard: {
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
  toolTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    textAlign: 'center',
  },
  toolDescription: {
    fontSize: 11,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
  },
  recommendationText: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
});