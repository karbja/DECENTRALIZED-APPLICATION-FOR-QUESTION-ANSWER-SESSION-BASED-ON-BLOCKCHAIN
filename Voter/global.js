import { Platform, LogBox } from "react-native";
if (Platform.OS !== "web") {
    require("react-native-get-random-values");
    LogBox.ignoreLogs([
      "Warning: The provided value 'ms-stream' is not a valid 'responseType'.",
      "Warning: The provided value 'moz-chunked-arraybuffer' is not a valid 'responseType'.",
    ]);
  }