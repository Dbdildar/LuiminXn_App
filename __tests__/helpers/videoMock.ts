/** Access to the root __mocks__/react-native-video.tsx state. */
export const videoMock = () => (globalThis as any).__videoMock as {seek: jest.Mock; props: any};
