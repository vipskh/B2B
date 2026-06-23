import { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ORANGE = "#FF6A00";

interface Props {
  visible: boolean;
  initialMin?: number;
  initialMax?: number;
  onClose: () => void;
  onApply: (range: { minPrice?: number; maxPrice?: number }) => void;
}

// Bottom-sheet price filter (1688-style "筛选").
export default function FilterModal({ visible, initialMin, initialMax, onClose, onApply }: Props) {
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  useEffect(() => {
    if (visible) {
      setMin(initialMin != null ? String(initialMin) : "");
      setMax(initialMax != null ? String(initialMax) : "");
    }
  }, [visible, initialMin, initialMax]);

  const apply = () =>
    onApply({
      minPrice: min ? Number(min) : undefined,
      maxPrice: max ? Number(max) : undefined,
    });

  const reset = () => {
    setMin("");
    setMax("");
    onApply({ minPrice: undefined, maxPrice: undefined });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-end"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} className="bg-background rounded-t-3xl p-6 pb-10">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-text-primary text-xl font-bold">Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text className="text-text-secondary text-sm mb-2">Price per unit ($)</Text>
          <View className="flex-row items-center gap-3">
            <TextInput
              className="flex-1 bg-surface rounded-2xl px-4 py-3 text-text-primary"
              placeholder="Min"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={min}
              onChangeText={setMin}
            />
            <Text className="text-text-secondary">—</Text>
            <TextInput
              className="flex-1 bg-surface rounded-2xl px-4 py-3 text-text-primary"
              placeholder="Max"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={max}
              onChangeText={setMax}
            />
          </View>

          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity className="flex-1 bg-surface rounded-2xl py-4 items-center" onPress={reset}>
              <Text className="text-text-primary font-bold">Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 rounded-2xl py-4 items-center"
              style={{ backgroundColor: ORANGE }}
              onPress={apply}
            >
              <Text className="text-white font-bold">Apply</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
