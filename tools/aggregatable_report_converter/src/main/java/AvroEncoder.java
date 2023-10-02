import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Scanner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.avro.Schema;
import org.apache.avro.file.DataFileReader;
import org.apache.avro.file.DataFileWriter;
import org.apache.avro.generic.GenericData;
import org.apache.avro.generic.GenericData.Record;
import org.apache.avro.generic.GenericDatumWriter;
import org.apache.avro.generic.GenericRecord;
import org.apache.avro.io.DatumWriter;
import org.json.JSONArray;
import org.json.JSONObject;

public class AvroEncoder {

  static String REPORT_SCHEMA = "{\n"
      + "  \"type\": \"record\",\n"
      + "  \"name\": \"AggregatableReport\",\n"
      + "  \"fields\": [\n"
      + "    {\n"
      + "      \"name\": \"payload\",\n"
      + "      \"type\": \"bytes\"\n"
      + "    },\n"
      + "    {\n"
      + "      \"name\": \"key_id\",\n"
      + "      \"type\": \"string\"\n"
      + "    },\n"
      + "    {\n"
      + "      \"name\": \"shared_info\",\n"
      + "      \"type\": \"string\"\n"
      + "    }\n"
      + "  ]\n"
      + "}";

  private static String readFileAsString(String file) throws IOException {
    return new String(Files.readAllBytes(Paths.get(file)));
  }

  public static void convertToAvroReport(HashMap<String, String> requestParameters) throws IOException {
    String fileName = Tools.getFileName(requestParameters);
    String file = requestParameters.get("inputFile");
    File outputAvroReport = new File (fileName);
    // check if the report is debug mode. If yes, the payload class will use the debug cleartext payload.
    boolean isDebug = Boolean.parseBoolean(requestParameters.get("debugMode"));
    Schema schema = new Schema.Parser().parse(REPORT_SCHEMA);
    DatumWriter<GenericRecord> avroWriter = new GenericDatumWriter<GenericRecord>(schema);
    DataFileWriter<GenericRecord> avroFileWriter = new DataFileWriter<GenericRecord>(avroWriter);
    avroFileWriter.create(schema, outputAvroReport);
    String reportJsonString = readFileAsString(file);
    try {
      AggregatableReport report = new AggregatableReport(reportJsonString);
      for (Payload payload : report.getAggregationServicePayloads()) {
        GenericRecord avroReport = new GenericData.Record(schema);
        avroReport.put("key_id", payload.getKeyId());
        avroReport.put("shared_info", report.getSharedInfo());
        // the getPayload will check if the request is debug or not.
        avroReport.put("payload", payload.getPayload(isDebug));
        avroFileWriter.append(avroReport);
      }
      avroFileWriter.close();
      System.out.println("Avro Report created: " + outputAvroReport);
    } catch (Exception e){
      System.out.println(e);
    }
  }

}
