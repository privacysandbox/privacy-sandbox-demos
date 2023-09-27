import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Scanner;
import org.apache.avro.Schema;
import org.apache.avro.file.DataFileWriter;
import org.apache.avro.generic.GenericData;
import org.apache.avro.generic.GenericData.Record;
import org.apache.avro.generic.GenericDatumWriter;
import org.apache.avro.generic.GenericRecord;
import org.apache.avro.io.DatumWriter;
import org.json.JSONObject;

public class OutputDomain {

  static String OUTPUT_DOMAIN_SCHEMA = "{\n"
      + "  \"type\": \"record\",\n"
      + "  \"name\": \"AggregationBucket\",\n"
      + "  \"fields\": [\n"
      + "    {\n"
      + "      \"name\": \"bucket\",\n"
      + "      \"type\": \"bytes\",\n"
      + "      \"doc\": \"A single bucket that appears in the aggregation service output. 128-bit integer encoded as a 16-byte big-endian bytestring.\"\n"
      + "    }\n"
      + "  ]\n"
      + "}";

  public static void createOutputDomain(HashMap<String, String> requestParams) throws IOException {
    BigInteger bucket = new BigInteger(requestParams.get("bucketKey"));
    String hex = bucket.toString(16);
    String bucketString = "";
    if((hex.length()%2) > 0){
      hex = "0" + hex;
    }

    List<String> hexList = new ArrayList<String>();
    int index = 0;
    while (index < hex.length()){
      hexList.add(hex.substring(index, index+2));
      index += 2;
    }
    byte[] bucketByteArray = new byte[hexList.size()];
    for (int i=0; i < hexList.size(); i++){
      bucketByteArray[i] = (byte) Integer.parseInt(hexList.get(i), 16);
    }
    ByteBuffer bucketByteBuffer = ByteBuffer.wrap(bucketByteArray);

    String fileName = Tools.getFileName(requestParams);
    File outputDomainAvro = new File (fileName);
    Schema schema = new Schema.Parser().parse(OUTPUT_DOMAIN_SCHEMA);
    DatumWriter<GenericRecord> avroWriter = new GenericDatumWriter<GenericRecord>(schema);
    DataFileWriter<GenericRecord> avroFileWriter = new DataFileWriter<GenericRecord>(avroWriter);
    avroFileWriter.create(schema, outputDomainAvro);
    GenericRecord bucketKey = new GenericData.Record(schema);
    bucketKey.put("bucket", bucketByteBuffer);
    avroFileWriter.append(bucketKey);
    avroFileWriter.close();
    System.out.println("Output Domain Avro created: " + fileName);
  }

}
