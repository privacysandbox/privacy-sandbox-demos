import java.nio.ByteBuffer;
import java.util.Base64;
import java.util.EmptyStackException;
import org.json.JSONObject;

public class Payload {
  private ByteBuffer debugCleartextPayload;
  private String keyId;
  private ByteBuffer payload;

  Payload(JSONObject jsonPayload){
    boolean debugPayloadExists = jsonPayload.has("debug_cleartext_payload");
    if (debugPayloadExists) {
      debugCleartextPayload = convertToBuffer(jsonPayload.getString("debug_cleartext_payload"));
    }
    keyId = jsonPayload.getString("key_id");
    payload = convertToBuffer(jsonPayload.getString("payload"));
  }

  private static ByteBuffer convertToBuffer (String payload){
    byte [] bytePayload = Base64.getDecoder().decode(payload);
    ByteBuffer decodedPayload = ByteBuffer.wrap(bytePayload);
    return decodedPayload;
  }

  public String getKeyId() {
    return keyId;
  }

  private ByteBuffer getDebugCleartextPayload() throws Exception {
    if (debugCleartextPayload == null) {
      throw new Exception("\"debug_cleartext_payload\" does not exist in report");
    }
    return debugCleartextPayload;
  }

  public ByteBuffer getPayload(boolean isDebug) throws Exception {
    if (isDebug){
      return getDebugCleartextPayload();
    }
    return payload;

  }
}
