/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ============================================================================
 * LỚP DỊCH VỤ TRUYỀN THÔNG MQTT / IOT (SIMULATED SERVICE LAYER)
 * ============================================================================
 * Hỗ trợ publish / subscribe mô phỏng cho hệ thống Smart Classroom.
 *
 * ⚙️ HƯỚNG DẪN THAY THẾ KHI KẾT NỐI PHẦN CỨNG THỰC TẾ:
 *
 * 1. MQTT QUA WEBSOCKET (Mosquitto / EMQX / HiveMQ):
 *    - Cài đặt: `npm install mqtt`
 *    - Khởi tạo:
 *      import mqtt from 'mqtt';
 *      const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
 *        clientId: 'smart_classroom_' + Math.random().toString(16).substr(2, 8),
 *        username: 'YOUR_USERNAME',
 *        password: 'YOUR_PASSWORD'
 *      });
 *      client.on('connect', () => { client.subscribe('classroom/#'); });
 *      client.on('message', (topic, payload) => { ... });
 *      client.publish(topic, JSON.stringify(payload));
 *
 * 2. THINGSBOARD IOT PLATFORM:
 *    - Telemetry URL: `https://thingsboard.cloud/api/v1/{ACCESS_TOKEN}/telemetry`
 *    - RPC Control: `https://thingsboard.cloud/api/v1/{ACCESS_TOKEN}/rpc`
 *    - Hoặc MQTT: broker `thingsboard.cloud:1883`, username = device access token
 *    - Topic Publish Telemetry: `v1/devices/me/telemetry`
 *    - Topic RPC Command: `v1/devices/me/rpc/request/+`
 *
 * 3. BLYNK IOT:
 *    - REST API: `https://blynk.cloud/external/api/update?token={BLYNK_TOKEN}&v1={value}`
 *    - Webhook: Push sự kiện khi phát hiện khói hoặc nhiệt độ vượt ngưỡng.
 *
 * 4. FIREBASE FIRESTORE REALTIME:
 *    - onSnapshot(doc(db, "classrooms", roomId), (doc) => { updateRoomState(doc.data()); });
 * ============================================================================
 */

export type MqttCallback = (payload: any, topic: string) => void;

interface MqttSubscription {
  topicPattern: string;
  callback: MqttCallback;
}

class MqttService {
  private subscriptions: MqttSubscription[] = [];
  private isConnected: boolean = true;
  private brokerUrl: string = 'wss://broker.smartclassroom.vn:8083/mqtt (Mô phỏng)';
  private latencyMs: number = 32;

  constructor() {
    // Tự động kiểm tra và duy trì kết nối giả lập
    this.startHeartbeat();
  }

  /**
   * Đăng ký nhận tin nhắn từ một topic (hỗ trợ wildcard '+' và '#')
   * Ví dụ: 'classroom/+/telemetry', 'classroom/A201/commands'
   */
  public subscribe(topicPattern: string, callback: MqttCallback): void {
    this.subscriptions.push({ topicPattern, callback });
    // console.log(`[MQTT] Subscribed to topic: ${topicPattern}`);
  }

  /**
   * Hủy đăng ký nhận tin nhắn
   */
  public unsubscribe(topicPattern: string, callback: MqttCallback): void {
    this.subscriptions = this.subscriptions.filter(
      (sub) => !(sub.topicPattern === topicPattern && sub.callback === callback)
    );
  }

  /**
   * Xuất bản (Publish) dữ liệu đến một topic
   * @param topic Topic đích (ví dụ: 'classroom/A201/relay/light')
   * @param payload Dữ liệu (object hoặc string/number)
   */
  public publish(topic: string, payload: any): void {
    if (!this.isConnected) {
      console.warn(`[MQTT] Không thể publish: Đang mất kết nối tới broker!`);
      return;
    }

    // console.log(`[MQTT Publish] Topic: ${topic}`, payload);

    // Mô phỏng độ trễ mạng thực tế 20-60ms
    setTimeout(() => {
      this.subscriptions.forEach((sub) => {
        if (this.matchTopic(sub.topicPattern, topic)) {
          try {
            sub.callback(payload, topic);
          } catch (err) {
            console.error(`[MQTT Error in callback for ${topic}]:`, err);
          }
        }
      });
    }, 30);
  }

  /**
   * So khớp topic MQTT với wildcard '+' (1 cấp) và '#' (đa cấp)
   */
  private matchTopic(pattern: string, topic: string): boolean {
    if (pattern === '#' || pattern === topic) return true;

    const patternParts = pattern.split('/');
    const topicParts = topic.split('/');

    for (let i = 0; i < patternParts.length; i++) {
      const p = patternParts[i];
      if (p === '#') return true;
      if (p === '+') continue;
      if (p !== topicParts[i]) return false;
    }

    return patternParts.length === topicParts.length;
  }

  /**
   * Thông tin trạng thái Broker phục vụ trang Cài đặt / Giám sát
   */
  public getConnectionInfo() {
    return {
      brokerUrl: this.brokerUrl,
      status: this.isConnected ? 'connected' : 'disconnected',
      latency: this.latencyMs,
      activeSubscriptions: this.subscriptions.length,
      protocol: 'MQTT v5.0 over WSS (Mô phỏng IoT Core)',
    };
  }

  private startHeartbeat(): void {
    setInterval(() => {
      // Giả lập ping dao động nhẹ 24ms - 45ms
      this.latencyMs = Math.floor(22 + Math.random() * 20);
    }, 4000);
  }
}

// Singleton instance
export const mqttService = new MqttService();
