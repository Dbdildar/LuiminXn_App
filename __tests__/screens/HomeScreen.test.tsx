import {render, screen} from '@testing-library/react-native';
import {HomeScreen} from '../../src/screens/Home';

describe('HomeScreen', () => {
  it('renders the welcome heading and placeholder text', () => {
    render(<HomeScreen />);

    expect(screen.getByTestId('home-screen')).toBeOnTheScreen();
    expect(
      screen.getByRole('header', {name: 'Welcome to LuminXn'}),
    ).toBeOnTheScreen();
    expect(screen.getByText('Your videos will appear here.')).toBeOnTheScreen();
  });
});
