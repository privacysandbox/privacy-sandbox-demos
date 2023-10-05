import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.sql.SQLOutput;
import java.util.Arrays;
import java.util.HashMap;
import org.apache.avro.Schema;
import org.apache.avro.file.DataFileReader;
import org.apache.avro.generic.GenericDatumReader;
import org.apache.avro.generic.GenericRecord;
import org.apache.avro.io.DatumReader;
import org.apache.avro.reflect.ReflectData;
import java.util.Scanner;
import org.json.JSONObject;

public class AvroFileReader {

  public static void avroReader(HashMap<String, String> requestParameters) throws IOException {
    String fileName = Tools.getFileName(requestParameters);
    String file = requestParameters.get("inputFile");

    DataFileReader<GenericRecord> dataFileReader = new DataFileReader<GenericRecord>(
        new File(file), new GenericDatumReader<>());

    GenericRecord report = null;
    FileWriter writer = new FileWriter(fileName);

    while (dataFileReader.hasNext()){
      report = dataFileReader.next(report);
      ByteBuffer byteBuffer = (ByteBuffer) report.get("bucket");
      StringBuilder hexString = new StringBuilder();
      for (int i=0; i<byteBuffer.capacity(); i++){
        hexString.append(String.format("%02x", byteBuffer.get(i)));
      }
      BigInteger bucket = new BigInteger(String.valueOf(hexString), 16);
      report.put("bucket", bucket);
      String reportString = report.toString();
      System.out.println(reportString);
      writer.write(reportString);
    }
    writer.close();
  }

}
