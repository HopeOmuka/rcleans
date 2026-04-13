import { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

interface DateTimePickerProps {
  visible: boolean;
  value: Date;
  mode?: "date" | "time" | "datetime";
  onClose: () => void;
  onChange: (date: Date) => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  visible,
  value,
  mode = "datetime",
  onClose,
  onChange,
}) => {
  const [selectedDate, setSelectedDate] = useState(value);
  const [selectedHour, setSelectedHour] = useState(value.getHours());
  const [selectedMinute, setSelectedMinute] = useState(value.getMinutes());
  const [activeTab, setActiveTab] = useState<"date" | "time">(
    mode === "time" ? "time" : "date",
  );

  useEffect(() => {
    setSelectedDate(value);
    setSelectedHour(value.getHours());
    setSelectedMinute(value.getMinutes());
  }, [value]);

  const generateDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const generateHours = () => {
    const hours = [];
    for (let i = 6; i <= 21; i++) {
      hours.push(i);
    }
    return hours;
  };

  const generateMinutes = () => {
    const minutes = [];
    for (let i = 0; i < 60; i += 15) {
      minutes.push(i);
    }
    return minutes;
  };

  const handleConfirm = () => {
    const newDate = new Date(selectedDate);
    newDate.setHours(selectedHour, selectedMinute, 0, 0);
    onChange(newDate);
    onClose();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour} ${period}`;
  };

  const formatMinute = (minute: number) => {
    return minute.toString().padStart(2, "0");
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Schedule Service</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.confirmText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "date" && styles.activeTab]}
              onPress={() => setActiveTab("date")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "date" && styles.activeTabText,
                ]}
              >
                Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "time" && styles.activeTab]}
              onPress={() => setActiveTab("time")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "time" && styles.activeTabText,
                ]}
              >
                Time
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "date" && (
            <ScrollView style={styles.scrollContent}>
              <View style={styles.dateGrid}>
                {generateDays().map((date, index) => {
                  const isSelected =
                    date.toDateString() === selectedDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dateItem,
                        isSelected && styles.selectedItem,
                      ]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text
                        style={[
                          styles.dateText,
                          isSelected && styles.selectedText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.selectedText,
                        ]}
                      >
                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.selectedDateText}>
                {formatDate(selectedDate)}
              </Text>
            </ScrollView>
          )}

          {activeTab === "time" && (
            <View style={styles.timeContainer}>
              <View style={styles.timeColumn}>
                <Text style={styles.columnTitle}>Hour</Text>
                <ScrollView
                  style={styles.timeScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {generateHours().map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeItem,
                        selectedHour === hour && styles.selectedTimeItem,
                      ]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          selectedHour === hour && styles.selectedTimeText,
                        ]}
                      >
                        {formatHour(hour)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.timeColumn}>
                <Text style={styles.columnTitle}>Minute</Text>
                <ScrollView
                  style={styles.timeScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {generateMinutes().map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timeItem,
                        selectedMinute === minute && styles.selectedTimeItem,
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          selectedMinute === minute && styles.selectedTimeText,
                        ]}
                      >
                        :{formatMinute(minute)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          <View style={styles.preview}>
            <Text style={styles.previewLabel}>Selected:</Text>
            <Text style={styles.previewText}>
              {formatDate(selectedDate)} at {formatHour(selectedHour)}:
              {formatMinute(selectedMinute)}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#1F1F1F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  cancelText: {
    color: "#666",
    fontSize: 16,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  confirmText: {
    color: "#4ADE80",
    fontSize: 16,
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#333",
  },
  activeTab: {
    backgroundColor: "#4ADE80",
  },
  tabText: {
    color: "#666",
    fontSize: 16,
  },
  activeTabText: {
    color: "white",
    fontWeight: "600",
  },
  scrollContent: {
    maxHeight: 200,
    paddingHorizontal: 10,
  },
  dateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  dateItem: {
    width: 60,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#333",
  },
  selectedItem: {
    backgroundColor: "#4ADE80",
  },
  dateText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  dayText: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  selectedText: {
    color: "white",
  },
  selectedDateText: {
    textAlign: "center",
    color: "#4ADE80",
    marginTop: 20,
    fontSize: 16,
  },
  timeContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 20,
  },
  timeColumn: {
    flex: 1,
  },
  columnTitle: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  timeScroll: {
    height: 200,
  },
  timeItem: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedTimeItem: {
    backgroundColor: "#4ADE80",
  },
  timeText: {
    color: "white",
    fontSize: 16,
  },
  selectedTimeText: {
    fontWeight: "600",
  },
  preview: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#333",
    marginHorizontal: 20,
    borderRadius: 12,
  },
  previewLabel: {
    color: "#666",
    fontSize: 12,
  },
  previewText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
});

export default DateTimePicker;
