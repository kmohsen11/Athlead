import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define workout type
interface Workout {
  id: string;
  type: 'Strength' | 'Cardio' | 'HIIT' | 'Flexibility';
  date: string;
  duration: string;
  muscleGroups: string[];
}

// Mock data for workout history
const mockWorkouts: Workout[] = [
  {
    id: '1',
    type: 'Strength',
    date: '2023-03-15',
    duration: '45 min',
    muscleGroups: ['Chest', 'Triceps'],
  },
  {
    id: '2',
    type: 'Cardio',
    date: '2023-03-13',
    duration: '30 min',
    muscleGroups: ['Legs'],
  },
  {
    id: '3',
    type: 'HIIT',
    date: '2023-03-10',
    duration: '25 min',
    muscleGroups: ['Full Body'],
  },
  {
    id: '4',
    type: 'Flexibility',
    date: '2023-03-08',
    duration: '20 min',
    muscleGroups: ['Back', 'Shoulders'],
  },
];

const WorkoutsScreen = () => {
  const renderWorkoutItem = ({ item }: { item: Workout }) => (
    <TouchableOpacity style={styles.workoutCard}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutTypeContainer}>
          <Ionicons 
            name={
              item.type === 'Strength' ? 'barbell-outline' :
              item.type === 'Cardio' ? 'heart-outline' :
              item.type === 'HIIT' ? 'timer-outline' :
              'body-outline' // Flexibility
            } 
            size={24} 
            color="#4F8EF7" 
          />
          <Text style={styles.workoutType}>{item.type}</Text>
        </View>
        <Text style={styles.workoutDate}>{item.date}</Text>
      </View>
      
      <View style={styles.workoutDetails}>
        <Text style={styles.workoutDuration}>Duration: {item.duration}</Text>
        <Text style={styles.workoutMuscles}>
          Muscle Groups: {item.muscleGroups.join(', ')}
        </Text>
      </View>
      
      <View style={styles.workoutFooter}>
        <TouchableOpacity style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout History</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#4F8EF7" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={mockWorkouts}
        renderItem={renderWorkoutItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    marginLeft: 4,
    color: '#4F8EF7',
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  workoutCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutType: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  workoutDate: {
    fontSize: 14,
    color: '#666',
  },
  workoutDetails: {
    marginBottom: 12,
  },
  workoutDuration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  workoutMuscles: {
    fontSize: 14,
    color: '#666',
  },
  workoutFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  viewDetailsButton: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewDetailsText: {
    color: '#4F8EF7',
    fontWeight: '500',
  },
});

export default WorkoutsScreen; 