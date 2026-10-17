import {fireEvent, render, screen} from '@testing-library/react-native';
import {VideoDetailScreen} from '../../../src/screens/VideoDetail';
import {makeVideo} from '../../helpers/fixtures';

describe('VideoDetailScreen', () => {
  const video = makeVideo(7, {title: 'The Long Night'});

  it('shows only the video name', () => {
    render(<VideoDetailScreen video={video} onBack={jest.fn()} />);
    expect(screen.getByTestId('video-detail-title')).toHaveTextContent('The Long Night');
    expect(screen.queryByTestId('preview-video')).toBeNull();
  });

  it('has a back button', () => {
    const onBack = jest.fn();
    render(<VideoDetailScreen video={video} onBack={onBack} />);
    fireEvent.press(screen.getByTestId('video-detail-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Go back')).toBeOnTheScreen();
  });
});
