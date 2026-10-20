declare module 'react-native-vector-icons/Feather' {
  import { ComponentClass } from 'react';
  import { TextProps } from 'react-native';
  
  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }
  
  const Feather: ComponentClass<IconProps>;
  export default Feather;
}