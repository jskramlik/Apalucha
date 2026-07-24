import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';

interface State { error: Error | null }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView style={styles.container}>
          <Text style={styles.title}>App Error</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          <Text style={styles.stack}>{this.state.error.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', padding: 20, paddingTop: 60 },
  title: { color: '#ff4444', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  message: { color: '#fff', fontSize: 16, marginBottom: 16 },
  stack: { color: '#aaa', fontSize: 11, fontFamily: 'monospace' },
});
