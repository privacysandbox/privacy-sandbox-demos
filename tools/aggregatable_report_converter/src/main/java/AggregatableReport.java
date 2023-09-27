import java.lang.reflect.Array;
import java.util.ArrayList;
import org.apache.avro.data.Json;
import org.json.JSONArray;
import org.json.JSONObject;

public class AggregatableReport {
  private String sharedInfo;
  private ArrayList<Payload> aggregationServicePayloads;

  public AggregatableReport(String reportString){
    JSONObject aggregatableJson = new JSONObject(reportString);
    sharedInfo = aggregatableJson.getString("shared_info");
    aggregationServicePayloads = getPayloads((JSONArray) aggregatableJson.get("aggregation_service_payloads"));
  }

  private static ArrayList<Payload> getPayloads(JSONArray payloads){
    ArrayList<Payload> aggregatePayloads = new ArrayList<>();
    for (Object aggregationReport : payloads){
      JSONObject report = (JSONObject) aggregationReport;
      Payload payload = new Payload(report);
      aggregatePayloads.add(payload);
    }
    return aggregatePayloads;
  }

  public String getSharedInfo() {
    return sharedInfo;
  }

  public ArrayList<Payload> getAggregationServicePayloads() {
    return aggregationServicePayloads;
  }
}
