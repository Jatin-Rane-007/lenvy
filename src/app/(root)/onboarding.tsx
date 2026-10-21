import { Text, View } from "react-native";

const onboarding = () => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <Text style={{ fontSize: 24, color: "black" }}>onboarding</Text>
    </View>
  );
};

export default onboarding;
